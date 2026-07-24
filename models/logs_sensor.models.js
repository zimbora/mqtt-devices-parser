module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("logs_sensor", {
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
		error: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		obj: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		remoteUnixTs: {
			type: DataTypes.BIGINT,
			allowNull: true,
		}
	},
	{
		tableName: 'logs_sensor',
		freezeTableName: true
	})
}

