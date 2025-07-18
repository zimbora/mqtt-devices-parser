
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("projects", {
		name: {
			type: DataTypes.STRING,
			unique: true
		},
		description: {
			type: DataTypes.STRING
		},
		project_table: {
			type: DataTypes.STRING,
			allowNull: true
		},
		logs_table: {
			type: DataTypes.STRING,
			allowNull: true
		},
		uidPrefix : {
			type: DataTypes.STRING,
			allowNull: false	
		},
		uidLength : {
			type: DataTypes.INTEGER,
			allowNull: false	
		}
	},
	{
		tableName: 'projects',
		freezeTableName: true
	})
}
