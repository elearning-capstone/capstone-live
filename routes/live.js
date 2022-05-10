const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();
const axios = require("axios");
const { live, chat, live_survey } = require("../models");

const course_ip = "http://ip-172-31-36-250.ap-southeast-1.compute.internal:3000";
const survey_ip = "http://ip-172-31-37-162.ap-southeast-1.compute.internal:3000";

router.post("/", async (req, res) => {
    try {
        const { name, description, start_at, end_at } = req.body;
        const { course_id } = req.query;

        if (typeof name != "string" || typeof description != "string" ||
            typeof start_at != "string" || typeof end_at != "string") {
            return res.status(400).json({ message: "invalid name, description, start_at or end_at" });
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

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
            attributes: { exclude: ["keygen", "createdAt", "updatedAt"] },
            where: {
                course_id: course_id,
                is_end: false,
                start_at: { [Op.lte]: now },
                end_at: { [Op.gte]: now }
            }
        });
        
        if (!current_live) {
            const videos = await axios.get(course_ip + "/course/videos", { params: { course_id } });
            return res.json({
                type: "videos",
                videos: videos.data.videos
            });
        }

        return res.json({
            type: "live",
            live: current_live 
        })
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

router.get("/sync", async (req, res) => {
    try {
        const { live_id, time, user_id } = req.query;
        const new_time = new Date();

        if (!live_id) {
            return res.status(400).json({ message: "missing live id" });
        }

        let count = await live.count({
            where: {
                id: live_id,
            },
        });

        if (count == 0) {
            return res.status(404).json({ message: "live not found" });
        }

        let condition = {
            live_id,
        };

        if (time) {
            condition.updatedAt = {
                [Op.gte]: time,
                [Op.lt]: new_time,
            };
        } else {
            condition.updatedAt = {
                [Op.lt]: new_time,
            };
        }

        let chats = chat.findAll({
            attributes: [ "message", "user_id" ],
            order: [ "createdAt" ],
            raw: true,
            where: condition,
        });

        let live_surveys = await live_survey.findAll({
            attributes: [ "survey_id" ],
            raw: true,
            where: {
                live_id,
            },
        });

        if (live_surveys.length == 0) {
            return res.json({
                chat: await chats,
                live_survey: [],
            });
        }

        live_surveys = await axios.get(survey_ip + "/survey/available", { params: { user_id, survey_id: live_surveys.map(element => element.survey_id) } });

        return res.json({
            chat: await chats,
            live_survey: live_surveys.data,
            time: new_time,
        });
    } catch(err) {
        return res.status(err.live_surveys.status || 404).json(err.live_surveys.data || { message: "not found" });
    }
});

router.post("/chat", async (req, res) => {
    try {
        const { live_id, user_id } = req.query;
        const { message } = req.body;

        let count = await live.count({
            where: {
                id: live_id,
            },
        });

        if (count == 0) {
            return res.status(404).json({ message: "live not found" });
        }

        await chat.create({
            live_id,
            user_id,
            message,
        });

        return res.json({ message: "success" });
    } catch(err) {
        return res.status(404).json({ message: "not found" });
    }
});

router.post("/survey", async (req, res) => {
    try {
        const { live_id, survey_id } = req.query;

        let count = await live.count({
            where: {
                id: live_id,
            },
        });

        if (count == 0) {
            return res.status(404).json({ message: "live not found" });
        }

        await live_survey.create({
            live_id,
            survey_id,
        });

        return res.json({ message: "success" });
    } catch(err) {
        return res.status(404).json({ message: "not found" });
    }
});

router.get("/course_id", async (req, res) => {
    try {
        const { live_id } = req.query;

        if (!live_id) {
            return res.status(400).json({ message: "require live id" });
        }

        let course_id = await live.findOne({
            attributes: [ "course_id" ],
            raw: true,
            where: {
                live_id,
            },
        });

        if (!course_id) {
            return res.status(404).json({ message: "live not found" });
        }

        return res.json({ course_id: course_id.course_id });
    } catch(err) {
        return res.status(404).json({ message: "not found" });
    }
});

module.exports = router;