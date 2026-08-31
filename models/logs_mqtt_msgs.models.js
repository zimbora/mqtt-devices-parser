
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("logs_mqtt_msgs", {
		device_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		topic: {
			type: DataTypes.STRING,
			allowNull: false
		},
		payload: {
			type: DataTypes.STRING,
			allowNull: true
		},
		qos: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		retain: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
	},
	{
		tableName: 'logs_mqtt_msgs',
		freezeTableName: true
	})
}
