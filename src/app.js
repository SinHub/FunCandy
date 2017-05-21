function trace() {
    cc.log(Array.prototype.join.call(arguments, ", "));
}

// 包括三层内容：最底下的背景图、中间10X10的糖果矩阵、最上层的 GameUI。
var GameLayer = cc.Layer.extend({
    // 由于糖果矩阵和 GameUI 后续还会访问到
    // 所以设计两个属性指向这两个内容
    mapPanel: null,         // 糖果矩阵
    ui: null,               // GameUI

    score: 0,               // 当前分数
    level: 0,               // 当前关卡
    steps: 0,               // 当前步数
    limitStep: 0,           // 限制步数
    targetScore: 0,         // 目标分数
    map: null,              // 逻辑上的糖果矩阵，通过行列号索引

    ctor: function() {
        this._super();
        // 加载背景：新建一个精灵 Sprite，把背景放到游戏画面的中间位置
        var size = cc.winSize;
        var bg = new cc.Sprite("res/bg.jpg");
        this.addChild(bg, 1);
        bg.x = size.width/2;
        bg.y = size.height/2;


        // 遮罩节点 ClippingNode：利用遮罩我们可以让指定范围内的内容显示，超出范围的内容隐藏
        var clippingPanel = new cc.ClippingNode();
        this.addChild(clippingPanel, 2);
        this.mapPanel = new cc.Layer();
        this.mapPanel.x = (size.width - Constant.CANDY_WIDTH*Constant.MAP_SIZE)/2;
        this.mapPanel.y = (size.height - Constant.CANDY_WIDTH*Constant.MAP_SIZE)/2;
        // 添加内容到遮罩节点上
        clippingPanel.addChild(this.mapPanel, 1);

        // 用 DrawNode 绘制一个正方形的裁剪区域，超出裁剪区域的内容将被隐藏，正好和糖果矩阵重叠
        var stencil = new cc.DrawNode();
        stencil.drawRect(cc.p(this.mapPanel.x,this.mapPanel.y), cc.p(this.mapPanel.x+Constant.CANDY_WIDTH*Constant.MAP_SIZE,this.mapPanel.y+Constant.CANDY_WIDTH*Constant.MAP_SIZE),
            cc.color(0,0,0), 1, cc.color(0,0,0));
        clippingPanel.stencil = stencil;


        // 监听鼠标和触摸事件
        if("touches" in cc.sys.capabilities) {
            cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                onTouchBegan: this._onTouchBegan.bind(this),
            }, this.mapPanel);
        } else {
            cc.eventManager.addListener({
                event: cc.EventListener.MOUSE,
                onMouseDown: this._onMouseDown.bind(this),
            }, this.mapPanel);
        }

        this._init();

        // 新建一个 GameUI 对象，添加到 GameLayer 上
        this.ui = new GameUI(this);
        this.addChild(this.ui, 3);

        return true;
    },

    _init: function() {
        this.steps = 0;
        this.level = Storage.getCurrentLevel();     // 获取当前游戏的进度
        this.score = Storage.getCurrentScore();     // 获取当前游戏的分数
        this.limitStep = Constant.levels[this.level].limitStep;
        this.targetScore = Constant.levels[this.level].targetScore;

        this.map = [];
        for(var i = 0; i< Constant.MAP_SIZE; i++) {
            var column = [];
            for(var j = 0; j < Constant.MAP_SIZE; j++) {
                var candy = Candy.createRandomType(i,j);
                this.mapPanel.addChild(candy);
                candy.x = i * Constant.CANDY_WIDTH + Constant.CANDY_WIDTH/2;
                candy.y = j * Constant.CANDY_WIDTH + Constant.CANDY_WIDTH/2;
                column.push(candy);
            }
            this.map.push(column);
        }
    },

    _onTouchBegan: function(touch, event) {
        var column = Math.floor((touch.getLocation().x - this.mapPanel.x)/Constant.CANDY_WIDTH);
        var row = Math.floor((touch.getLocation().y - this.mapPanel.y)/Constant.CANDY_WIDTH);
        this._popCandy(column, row);
        return true;
    },

    _onMouseDown: function(event) {
        var column = Math.floor((event.getLocationX() - this.mapPanel.x)/Constant.CANDY_WIDTH);
        var row = Math.floor((event.getLocationY() - this.mapPanel.y)/Constant.CANDY_WIDTH);
        this._popCandy(column, row);
    },

    /* 核心代码：糖果消除代码 */
    _popCandy: function (column, row) {
        // 保证生成新糖果的时候不会重复执行点击消除糖果事件
        if(this.moving)
            return;

        var joinCandys = [this.map[column][row]];
        var index = 0;
        var pushIntoCandys = function(element){
            if(joinCandys.indexOf(element) < 0)
                joinCandys.push(element);
        };
        while(index < joinCandys.length){
            var candy = joinCandys[index];
            if(this._checkCandyExist(candy.column-1, candy.row) && this.map[candy.column-1][candy.row].type == candy.type){
                pushIntoCandys(this.map[candy.column-1][candy.row]);
            }
            if(this._checkCandyExist(candy.column+1, candy.row) && this.map[candy.column+1][candy.row].type == candy.type){
                pushIntoCandys(this.map[candy.column+1][candy.row]);
            }
            if(this._checkCandyExist(candy.column, candy.row-1) && this.map[candy.column][candy.row-1].type == candy.type){
                pushIntoCandys(this.map[candy.column][candy.row-1]);
            }
            if(this._checkCandyExist(candy.column, candy.row+1) && this.map[candy.column][candy.row+1].type == candy.type){
                pushIntoCandys(this.map[candy.column][candy.row+1]);
            }
            index++;
        }

        if(joinCandys.length <= 1)
            return;

        this.steps++;
        this.moving = true;

        for (var i = 0; i < joinCandys.length; i++) {
            var candy = joinCandys[i];
            this.mapPanel.removeChild(candy);
            this.map[candy.column][candy.row] = null;
        }

        this.score += joinCandys.length*joinCandys.length;
        // 执行生成新糖果逻辑
        this._generateNewCandy();
        // 检查游戏进度（胜利或失败）
        this._checkSucceedOrFail();
    },

    _checkCandyExist: function(i, j){
        if(i >= 0 && i < Constant.MAP_SIZE && j >= 0 && j < Constant.MAP_SIZE){
            return true;
        }
        return false;
    },

    // 糖果补充逻辑：
    // (1)遍历糖果矩阵二维数组的每一列，每一列中再从下往上遍历该列的每个糖果
    // (2)每列遍历开始时，设计空位计数器为0.
    // (3)如果某个位置为null，则表示该位置的糖果已经在 _popCandy 中被删除，此时把该列的空位计数器加1，
    //      并在整列的最上方添加一个新随机糖果，并添加到二维数组的该列数据中。
    // (4)如果某个位置为糖果，则需要安排这个糖果下落。当前空位计数器的数值正好就是该糖果需要下落的距离。
    //      设置糖果下落后，需要调整原位置为null，下落到的位置填入该糖果。
    // (5)当遍历完该列最后一个糖果（包括刚新加的糖果）后，该列检查工作就完成了。需要把超出10的数组位置删除
    _generateNewCandy: function () {
        var maxTime = 0;
        for (var i = 0; i < Constant.MAP_SIZE; i++) {        //deal each column
            var missCount = 0;
            for (var j = 0; j < this.map[i].length; j++) {

                var candy = this.map[i][j];
                if(!candy){
                    var candy = Candy.createRandomType(i,Constant.MAP_SIZE+missCount);
                    this.mapPanel.addChild(candy);
                    candy.x = candy.column * Constant.CANDY_WIDTH + Constant.CANDY_WIDTH/2;
                    candy.y = candy.row * Constant.CANDY_WIDTH + Constant.CANDY_WIDTH/2;
                    this.map[i][candy.row] = candy;
                    missCount++;
                }else{
                    var fallLength = missCount;
                    if(fallLength > 0){
                        var duration = Math.sqrt(2*fallLength/Constant.FALL_ACCELERATION);
                        if(duration > maxTime)
                            maxTime = duration;
                        // 让糖果位置变化时执行一个模拟自由落体运动的动作
                        var move = cc.moveTo(duration, candy.x, candy.y-Constant.CANDY_WIDTH*fallLength).easing(cc.easeIn(2));    //easeIn参数是幂，以几次幂加速
                        candy.runAction(move);
                        candy.row -= fallLength;        //adjust all candy's row
                        this.map[i][j] = null;
                        this.map[i][candy.row] = candy;
                    }
                }
            }

            //移除超出地图的临时元素位置
            for (var j = this.map[i].length; j >= Constant.MAP_SIZE; j--) {
                this.map[i].splice(j, 1);
            }
        }
        this.scheduleOnce(this._finishCandyFalls.bind(this), maxTime);
    },

    _finishCandyFalls: function () {
        this.moving = false;
    },

    // 如果分数达到目标分数：显示过关提示，同时把剩余步数转化为分数
    // 如果分数没达到目标，而且当前步数已经大于或等于限制步数：显示失败提示
    // 无论成功还是失败，3秒后将切换界面，胜利则进入下一关，失败则重新开始
    _checkSucceedOrFail: function () {
        if(this.score > this.targetScore){
            this.ui.showSuccess();
            this.score += (this.limitStep - this.steps) * 30;
            // 设置游戏进度为下一关，并保存当前分数
            Storage.setCurrentLevel(this.level+1);
            Storage.setCurrentScore(this.score);
            this.scheduleOnce(function(){
                cc.director.runScene(new GameScene());
            }, 3);
        }else if(this.steps >= this.limitStep){
            this.ui.showFail();
            // 吧关卡和当前分数都重置为0
            Storage.setCurrentLevel(0);
            Storage.setCurrentScore(0);
            this.scheduleOnce(function(){
                cc.director.runScene(new GameScene());
            }, 3);
        }
    }
});

/* 游戏场景 */
var GameScene = cc.Scene.extend({
    onEnter: function() {
        this._super();
        // 新建 GameLayer 类
        var layer = new GameLayer();
        this.addChild(layer);
    }
});