/*
 * 常量列表
 *
*/

var Constant = {
	CANDY_WIDTH: 64,		// 糖果图片宽高常量
    CANDY_TYPE_COUNT: 5,	// 糖果种类数目
    MAP_SIZE: 10,			// 糖果矩阵宽高常量
    FALL_ACCELERATION: 30,	// 下落加速度

    // 关卡设计
	// limitStep 是限制步数
	// targetScore 是目标分数
	levels: [
		{limitStep:30, targetScore:500},
		{limitStep:25, targetScore:1000},
		{limitStep:20, targetScore:2000},
		{limitStep:20, targetScore:3000},
		{limitStep:15, targetScore:4000},
		{limitStep:10, targetScore:5000}
	]
};

