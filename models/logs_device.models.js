
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("logs_devices", {
		device_id: {
			type: DataTypes.INTEGER,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: true
		},
		project_id: {
			type: DataTypes.INTEGER,
			references: {
				model: 'projects',
				key: 'id'
			}
		},
		model_id: {
			type: DataTypes.INTEGER,
			references: {
				model: 'models',
				key: 'id'
			}
		},
		version: {
			type: DataTypes.STRING,
			allowNull: true
		},
		app_version: {
			type: DataTypes.STRING,
			allowNull: true
		},
		tech: {
			type: DataTypes.STRING,
			allowNull: true
		},
		associatedDevice: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		local_settings: { // server settings
			type: DataTypes.JSON,
			allowNull: true
		},
		remote_settings: { // server settings
			type: DataTypes.JSON,
			allowNull: true
		},
		settings_ref: { // settings to be used, can be a uid, deviceId, default..
			type: DataTypes.STRING,
			allowNull: true
		},
		endpoint: { // info about protocol communication
			type: DataTypes.JSON,
			allowNull: true
		},
	},
	{
		tableName: 'logs_devices',
		freezeTableName: true
	})
}
