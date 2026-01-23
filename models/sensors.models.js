
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("sensors", {
		model_id: { // reference a model
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'models',
				key: 'id'
			}
		},
		device_id: { // reference a device id
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'devices',
				key: 'id'
			}
		},
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		ref: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		property: {
			type: DataTypes.STRING,
			allowNull: true
		},
		value: {
			type: DataTypes.STRING,
			allowNull: true
		},
		error: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		remoteUnixTs: {
			type: DataTypes.BIGINT,
			allowNull: true,
		},
		graph: {
			type: DataTypes.JSON,
			allowNull: true,
		}
	},
	{
		tableName: 'sensors',
		freezeTableName: true
	})
}

