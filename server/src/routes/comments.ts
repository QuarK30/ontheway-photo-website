import { Router } from "express";
import { Comment } from "../models/Comment";
import { requireAuth } from "../middleware/auth";

const router = Router();

/** 管理员：获取所有留言，可选按图片筛选 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const photoId = req.query.photoId as string | undefined;
    const filter = photoId ? { photoId } : {};
    const comments = await Comment.find(filter).sort({ createdAt: -1 }).lean();
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "获取留言列表失败" });
  }
});

/** 管理员：删除留言 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: "未找到该留言" });
    res.json({ message: "已删除" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "删除失败" });
  }
});

/** 管理员：隐藏/显示留言 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const hidden = req.body.hidden;
    if (typeof hidden !== "boolean") {
      return res.status(400).json({ message: "请提供 hidden: true/false" });
    }
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $set: { hidden } },
      { new: true }
    ).lean();
    if (!comment) return res.status(404).json({ message: "未找到该留言" });
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "更新失败" });
  }
});

export default router;
