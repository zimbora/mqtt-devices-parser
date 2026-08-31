
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("logs_mqtt", {
		mqtt_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		device_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		source: {
			type: DataTypes.STRING,
			allowNull: false
		},
		action: {
			type: DataTypes.STRING,
			allowNull: false
		},
		payload: {
			type: DataTypes.STRING,
			allowNull: true
		},
	},
	{
		tableName: 'logs_mqtt',
		freezeTableName: true
	})
}
