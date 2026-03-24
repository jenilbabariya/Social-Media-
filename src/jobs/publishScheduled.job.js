import cron from "node-cron";
import Post from "../models/post.model.js";

// runs every minute
export const startScheduledPostJob = () => {
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const posts = await Post.find({
                status: "scheduled",
                publishAt: { $lte: now },
            });

            for (const post of posts) {
                post.status = "published";
                await post.save();
                console.log(`Published scheduled post: ${post._id}`);
            }
        } catch (error) {
            console.error("Scheduled post job error:", error);
        }
    });
};