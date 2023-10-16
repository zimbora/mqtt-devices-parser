module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("sensor_logs", {
		device_id: {
			type: DataTypes.INTEGER,
			unique: false,
			allowNull: false,
			references: {
				model: 'devices',
				key: 'id'
			}
		},
		sensor_id: {
			type: DataTypes.INTEGER,
			unique: false,
			allowNull: false,
			references: {
				model: 'sensors',
				key: 'id'
			}
		},
		value: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		cliend_id: {
			type: DataTypes.INTEGER,
			unique: false,
			allowNull: true,
			references: {
				model: 'clients',
				key: 'id'
			}
		},

	},
	{
		tableName: 'sensor_logs',
		freezeTableName: true
	})
}

