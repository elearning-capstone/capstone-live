module.exports = (sequelize, DataTypes) => {
    const live_survey = sequelize.define("live_survey", {
        live_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        survey_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    });

    return live_survey;
}