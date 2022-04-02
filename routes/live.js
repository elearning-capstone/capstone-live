const express = require("express");
const router = express.Router();
const { live } = require("../models");

router.post("/", async (req, res) => {
    try {
        const { name, description, start_at } = req.body;
        const { course_id } = req.query;

        if (typeof name != "string" || typeof description != "string" || typeof start_at != "string") {
            return res.status(400).json({ message: "invalid name, description or start_at" });
        }

        return res.json({ 
            live: await live.create({
                name,
                description,
                start_at,
                course_id
            }),
        });
    } catch(err) {
        return res.status(404).json({ message: "not found" });
    }
});

router.put("/info", async (req, res) => {
    try {
        const { name, description } = req.body;
        const live_id = req.query;

        if (typeof live_id != "number") {
            return res.status(400).json({ message: "invalid live_id" });
        }

        let count = await live.count({
            where: {
                id: live_id,
            }
        });

        if (count == 0) {
            return res.status(404).json({ message: "live not found" });
        };

        if (name && typeof name != "string" || description && typeof description != "string") {
            return res.status(400).json({ message: "invalid name or description" });
        };

        let payload = {};
        if (name) payload.name = name;
        if (description) payload.description = description;

        await live.update(payload, {
            where: {
                id: live_id,
            }
        });

        return res.json({ message: "success" });
    } catch(err) {
        return res.status(404).json({ message: "not found" });
    }
});

router.put("/", async (req, res) => {
    try {
        const { name, description, keygen, stream_url, video_url } = req.body;
        const live_id = req.query;

        if (typeof live_id != "number") {
            return res.status(400).json({ message: "invalid live_id" });
        }

        let count = await live.count({
            where: {
                id: live_id,
            }
        });

        if (count == 0) {
            return res.status(404).json({ message: "live not found" });
        };

        if (name && typeof name != "string" ||
            description && typeof description != "string" ||
            keygen && typeof keygen != "string" ||
            stream_url && typeof stream_url != "string" ||
            video_url && typeof video_url != "string" ) {
            return res.status(400).json({ message: "invalid field" });
        };

        let payload = {};
        if (name) payload.name = name;
        if (description) payload.description = description;
        if (keygen) payload.keygen = keygen;
        if (stream_url) payload.stream_url = stream_url;
        if (video_url) payload.video_url = video_url;

        await live.update(payload, {
            where: {
                id: live_id,
            }
        });

        return res.json({ message: "success" });
    } catch(err) {
        return res.status(404).json({ message: "not found" });
    }
});


router.get("/", async (req, res) => {

});

router.delete("/", async (req, res) => {
    try {
        const live_id = req.query;

        if (typeof live_id != "number") {
            return res.status(400).json({ message: "invalid live_id" });
        }

        let count = await live.count({
            where: {
                id: live_id,
            }
        });

        if (count == 0) {
            return res.status(404).json({ message: "live not found" });
        };

        await live.update({
            is_end: true
        } , {
            where: {
                id: live_id,
            }
        });

        return res.json({ message: "success" });
    } catch(err) {
        return res.status(404).json({ message: "not found" });
    }
});

module.exports = router;