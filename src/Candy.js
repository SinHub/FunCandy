/*
 * 继承 Sprite,专门用预加载一个糖果图片
 *
 **/
var Candy = cc.Sprite.extend({

 	type: 0,
 	column: 0,
 	row: 0,

 	ctor: function(type, column, row) {
 		this._super("res/"+(type+1)+".png");
 		this.init(type, column, row);
 	},

 	init: function(type, column, row) {
 		this.type = type;
 		this.column = column;
 		this.row = row;
 	}
});

Candy.createRandomType = function(column, row) {
	return new Candy(parseInt(Math.random()*Constant.CANDY_TYPE_COUNT), column, row);
}