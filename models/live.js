module.exports = (sequelize, DataTypes) => {
    const live = sequelize.define("live", {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        keygen: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_end: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        start_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: true,
            }
        },
        stream_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        video_url: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    });

    return live;
}