const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();
const { live, chat, live_survey } = require("../models");

router.get("/sync", async (req, res) => {
    try {
        const { live_id, time } = req.query;

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
            condition.updated_at = {
                [Op.gte]: time,
            };
        }

        let chats = chat.findAll({
            attributes: [ "message", "user_id" ],
            order: [ "created_at" ],
            raw: true,
            where: condition,
        });

        let live_surveys = live_survey.findAll({
            attributes: [ "survey_id" ],
            raw: true,
            where: condition,
        });

        return res.json({
            chat: await chats,
            live_survey: await live_surveys,
        });
    } catch(err) {
        return res.status(404).json({ message: "not found" });
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

module.exports = router;