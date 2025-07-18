module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("logs_fota", {
		device_id: {
			type: DataTypes.INTEGER,
		},
		model_id: {
			type: DataTypes.STRING,
		},
		local_version: {
			type: DataTypes.STRING,
		},
		local_app_version: {
			type: DataTypes.STRING,
		},
		target_version: {
			type: DataTypes.STRING,
		},
		target_app_version: {
			type: DataTypes.STRING,
		},
		target_file: {
			type: DataTypes.STRING,
		},
		error: {
			type: DataTypes.STRING,
			allowNull: true
		},
		success: {
			type: DataTypes.BOOLEAN,
			default: 0
		},
		nAttempt: {
			type: DataTypes.INTEGER,
			default: 0
		},
	},
	{
		tableName: 'logs_fota',
		freezeTableName: true
	})
}
