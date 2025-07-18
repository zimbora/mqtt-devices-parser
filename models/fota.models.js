module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("fota", {
		device_id: {
			type: DataTypes.INTEGER,
			unique: true,
		},
		target_version: {
			type: DataTypes.STRING,
		},
		target_app_version: {
			type: DataTypes.STRING,
		},
		target_release: {
			type: DataTypes.STRING,
		},
		firmware_id: {
			type: DataTypes.INTEGER,
		},
		nAttempts: {
			type: DataTypes.INTEGER,
			default: 0
		},
		fUpdate: {
			type: DataTypes.BOOLEAN,
			default: 0
		},
	},
	{
		tableName: 'fota',
		freezeTableName: true
	})
}
