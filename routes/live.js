const express = require("express");
const router = express.Router();
const { live } = require("../models");
const { Op } = require('sequelize')

router.post("/", async (req, res) => {
    try {
        const { name, description, start_at, end_at } = req.body;
        const { course_id } = req.query;

        if (typeof name != "string" || typeof description != "string" ||
            typeof start_at != "string" || typeof end_at != "string") {
            return res.status(400).json({ message: "invalid name, description, start_at or end_at" });
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        console.log(now);

        if (end_at <= start_at) {
            return res.status(403).json({ message: "invalid time: end_at must be after start_at" });
        }

        if (start_at < now) {
            return res.status(403).json({ message: "invalid time: start_at must not be in the past" });
        }

        let count = await live.count({
            where: {
                course_id: course_id,
                is_end: false,
                [Op.or]: [{ start_at: { [Op.between]: [start_at, end_at] } }, { end_at: { [Op.between]: [start_at, end_at] } }]
            }
        });

        if (count != 0) {
            return res.status(403).json({ message: "invalid time: overlap with another live" });
        }

        return res.json({
            live: await live.create({
                name: name,
                description: description,
                start_at: start_at,
                end_at: end_at,
                course_id: course_id
            })
        });

    } catch(err) {
        console.log(err);
        return res.status(404).json({ message: "not found" });
    }
});

router.put("/info", async (req, res) => {
    try {
        const { name, description } = req.body;
        const { live_id } = req.query;

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
        const { live_id } = req.query;

        if (!live_id) {
            return res.status(400).json({ message: "please input live_id" });
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
    try {
        const { course_id } = req.query;

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const current_live = await live.findOne({
            where: {
                course_id: course_id,
                is_end: false,
                start_at: { [Op.lte]: now },
                end_at: { [Op.gte]: now }
            }
        });
        
        if (!current_live) return res.status(400).json({ message: "no live is broadcasting now" });

        return res.json({ live: current_live })
    } catch(err) {
        return res.status(404).json({ message: "not found" });
    }
});

router.delete("/", async (req, res) => {
    try {
        const { live_id } = req.query;

        if (!live_id) {
            return res.status(400).json({ message: "please input live_id" });
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