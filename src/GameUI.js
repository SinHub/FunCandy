/*
 * 游戏的UI
 *
*/

var GameUI = cc.Layer.extend({
 	levelText: null,			// 关卡信息
 	scoreText: null,			// 分数信息
 	stepText: null,				// 步数信息
 	/* GameLayer 新建 GameUI 的时候把自己传递进来，信息通过 GameLayer 获取 */
 	gameLayer: null,			// 当前游戏层

 	ctor: function(gameLayer) {
 		this._super();
 		this.gameLayer = gameLayer;

 		this._initInfoPanel();

 		/* 实现每帧不断刷新 */
 		this.scheduleUpdate();
 	},

 	// 信息栏初始化
 	_initInfoPanel: function() {
 		var size = cc.director.getWinSize();
 		/* 关卡label */
 		var levelLabel = new cc.LabelTTF("Level", "arial", 36);
 		levelLabel.x = 100;
 		levelLabel.y = size.height - 50;
 		levelLabel.setColor(cc.color(0,0,0));
 		this.addChild(levelLabel);

 		var levelText = new cc.LabelTTF("1", "arial", 36);
 		levelText.x = 100;
 		levelText.y = levelLabel.y - 40;
 		levelText.setColor(cc.color(0,0,0));
 		this.addChild(levelText);
 		this.levelText = levelText;

 		/* 分数label */
 		var scoreLabel = new cc.LabelTTF("Score", "arial", 36);
 		scoreLabel.x = 370;
 		scoreLabel.y = levelLabel.y;
 		scoreLabel.setColor(cc.color(0,0,0));
 		this.addChild(scoreLabel);

 		var scoreText = new cc.LabelTTF("1", "arial", 36);
 		scoreText.x = 370;
 		scoreText.y = levelText.y;
 		scoreText.setColor(cc.color(0,0,0));
 		this.addChild(scoreText);
 		this.scoreText = scoreText;

 		/* 步数label */
 		var stepLabel = new cc.LabelTTF("Step", "arial", 36);
 		stepLabel.x = 620;
 		stepLabel.y = levelLabel.y;
 		stepLabel.setColor(cc.color(0,0,0));
 		this.addChild(stepLabel);

 		var stepText = new cc.LabelTTF("1", "arial", 36);
 		stepText.x = 620;
 		stepText.y = levelText.y;
 		stepText.setColor(cc.color(0,0,0));
 		this.addChild(stepText);
 		this.stepText = stepText;
 	},


 	update: function() {
 		this.levelText.setString("" + (this.gameLayer.level + 1));
 		this.scoreText.setString("" + (this.gameLayer.score));
 		this.stepText.setString("" + (this.gameLayer.limitStep - this.gameLayer.steps));
 	},

 	/* 关卡胜利提示 */
 	showSuccess: function() {
 		// 直接使用 LayerColor 来实现白底层
 		var bg = new cc.LayerColor(cc.color(255,255,255),500,500);
 		this.addChild(bg, 1);
 		var size = cc.director.getWinSize();
 		bg.x = (size.width - bg.width)/2;
 		bg.y = (size.width - bg.height)/2;
 		var stepText = new cc.LabelTTF("恭喜，已完成第" + (this.gameLayer.level + 1) + "关，\n剩余步数30倍奖励！", "arial", 50);
 		stepText.setColor(cc.color(0, 0, 0));
 		stepText.x = 250;
 		stepText.y = 250;
 		bg.addChild(stepText);
 	},

 	/* 关卡失败提示 */
 	showFail: function() {
 		// 直接使用 LayerColor 来实现白底层
 		var bg = new cc.LayerColor(cc.color(255,255,255),500,500);
 		this.addChild(bg, 1);
 		var size = cc.director.getWinSize();
 		bg.x = (size.width - bg.width)/2;
 		bg.y = (size.height - bg.height)/2;
 		var stepText = new cc.LabelTTF("失败了，\n从头来过吧！","arial", 56);
 		stepText.setColor(cc.color(0,0,0));
 		stepText.x = 250;
 		stepText.y = 250;
 		bg.addChild(stepText);
 	}
 });