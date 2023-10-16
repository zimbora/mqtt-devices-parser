
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("sensors", {
		model_id: {
			type: DataTypes.INTEGER,
			unique: false,
			allowNull: false,
			references: {
				model: 'models',
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

