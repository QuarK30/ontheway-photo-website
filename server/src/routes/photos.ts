import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Photo } from "../models/Photo";
import { Comment } from "../models/Comment";
import { requireAuth } from "../middleware/auth";

const router = Router();
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage });

router.get("/", async (_req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 }).lean();
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "获取照片列表失败" });
  }
});

/** 某张照片下的留言列表（仅未隐藏，游客可见） */
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ photoId: req.params.id, hidden: false })
      .sort({ createdAt: -1 })
      .lean();
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "获取留言失败" });
  }
});

/** 发表留言（游客，无需登录） */
router.post("/:id/comments", async (req, res) => {
  try {
    const nickname = String(req.body.nickname ?? "").trim();
    const content = String(req.body.content ?? "").trim();
    if (!nickname) return res.status(400).json({ message: "请填写昵称" });
    if (!content) return res.status(400).json({ message: "请填写留言内容" });
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: "未找到该照片" });
    const doc = await Comment.create({
      photoId: req.params.id,
      nickname,
      content
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "发表失败" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id).lean();
    if (!photo) return res.status(404).json({ message: "未找到该照片" });
    res.json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "获取照片失败" });
  }
});

function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}
function isValidLng(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "请上传图片" });
    const body = req.body as Record<string, string>;
    const lat = parseFloat(body.lat);
    const lng = parseFloat(body.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "请提供有效的经纬度" });
    }
    if (!isValidLat(lat)) return res.status(400).json({ message: "纬度范围为 -90 至 90" });
    if (!isValidLng(lng)) return res.status(400).json({ message: "经度范围为 -180 至 180" });
    const imageUrl = "/uploads/" + file.filename;
    const shotAt = body.shotAt ? new Date(body.shotAt) : null;
    const doc = await Photo.create({
      title: body.title || "未命名",
      description: body.description || "",
      placeName: body.placeName || "",
      shotAt,
      location: { lat, lng },
      imageUrl
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "上传失败" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const body = req.body as Record<string, string>;
    const lat = body.lat != null ? parseFloat(body.lat) : undefined;
    const lng = body.lng != null ? parseFloat(body.lng) : undefined;
    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.placeName !== undefined) update.placeName = body.placeName;
    if (body.shotAt !== undefined) update.shotAt = body.shotAt ? new Date(body.shotAt) : null;
    if (lat !== undefined && lng !== undefined) {
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({ message: "请提供有效的经纬度" });
      }
      if (!isValidLat(lat)) return res.status(400).json({ message: "纬度范围为 -90 至 90" });
      if (!isValidLng(lng)) return res.status(400).json({ message: "经度范围为 -180 至 180" });
      update.location = { lat, lng };
    }
    const photo = await Photo.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    if (!photo) return res.status(404).json({ message: "未找到该照片" });
    res.json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "更新失败" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ message: "未找到该照片" });
    res.json({ message: "已删除" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "删除失败" });
  }
});

export default router;
