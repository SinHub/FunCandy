function trace() {
    cc.log(Array.prototype.join.call(arguments, ", "));
}

var GameLayer = cc.Layer.extend({
    mapPanel: null,
    ui: null,

    score: 0,
    level: 0,
    steps: 0,
    limitStep: 0,
    targetScore: 0,
    map: null,

    ctor: function() {
        this._super();
        var size = cc.winSize;
        var bg = new cc.Sprite("res/bg.jpg");
        this.addChild(bg, 1);
        bg.x = size.width/2;
        bg.y = size.height/2;

        var clippingPanel = new cc.ClippingNode();
        this.addChild(clippingPanel, 2);
        this.mapPanel = new cc.Layer();
        this.mapPanel.x = (size.width - Constant.CANDY_WIDTH*Constant.MAP_SIZE)/2;
        this.mapPanel.y = (size.height - Constant.CANDY_WIDTH*Constant.MAP_SIZE)/2;
        clippingPanel.addChild(this.mapPanel, 1);

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
        this.level = 0;
        this.score = 0;
        this.limitStep = 30;
        this.targetScore = 100;

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

    _onMouseDown: function(touch, event) {
        var column = Math.floor((event.getLocation().x - this.mapPanel.x)/Constant.CANDY_WIDTH);
        var row = Math.floor((event.getLocation().y - this.mapPanel.y)/Constant.CANDY_WIDTH);
        this._popCandy(column, row);
    },

    _popCandy: function (column, row) {
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
        this._generateNewCandy();
        this._checkSucceedOrFail();
    },

    _checkCandyExist: function(i, j){
        if(i >= 0 && i < Constant.MAP_SIZE && j >= 0 && j < Constant.MAP_SIZE){
            return true;
        }
        return false;
    },

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

    _checkSucceedOrFail: function () {
        if(this.score > this.targetScore){
            this.ui.showSuccess();
            this.score += (this.limitStep - this.steps) * 30;
            Storage.setCurrentLevel(this.level+1);
            Storage.setCurrentScore(this.score);
            this.scheduleOnce(function(){
                cc.director.runScene(new GameScene());
            }, 3);
        }else if(this.steps >= this.limitStep){
            this.ui.showFail();
            Storage.setCurrentLevel(0);
            Storage.setCurrentScore(0);
            this.scheduleOnce(function(){
                cc.director.runScene(new GameScene());
            }, 3);
        }
    }
});


var GameScene = cc.Scene.extend({
    onEnter: function() {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
    }
});