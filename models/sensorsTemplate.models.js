
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("sensorsTemplate", {
		model_id: { // reference a model
			type: DataTypes.INTEGER,
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
		property: {
			type: DataTypes.STRING,
			allowNull: true
		},
		graph: {
			type: DataTypes.JSON,
			allowNull: true,
		}
	},
	{
		tableName: 'sensorsTemplate',
		freezeTableName: true
	})
}

