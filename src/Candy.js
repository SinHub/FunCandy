/*
 * 继承 Sprite,专门用预加载一个糖果图片
 *
 **/
var Candy = cc.Sprite.extend({

 	type: 0,		// 类型
 	column: 0,		// 列号
 	row: 0,			// 行号

 	// 父类构造函数实现图片的加载
 	ctor: function(type, column, row) {
 		this._super("res/"+(type+1)+".png");
 		this.init(type, column, row);
 	},

 	// 初始化函数
 	init: function(type, column, row) {
 		this.type = type;
 		this.column = column;
 		this.row = row;
 	}
});

// 静态方法新建随机糖果
Candy.createRandomType = function(column, row) {
	return new Candy(parseInt(Math.random()*Constant.CANDY_TYPE_COUNT), column, row);
}