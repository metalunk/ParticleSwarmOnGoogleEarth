/**
 * Coordinate
 */
var Coordinate;
(function (_Coordinate) {
    var MAXIMIZATION = 1; // -1 : minimization, 1 : maximization
    var ROUND = 100000000;
    /**
     * 座標と標高を扱う Class
     */
    var Coordinate = (function () {
        function Coordinate(longitude, latitude, elevation) {
            if (elevation === void 0) { elevation = null; }
            this.longitude = longitude;
            this.latitude = latitude;
            this.elevation = elevation;
        }
        /**
         * @param elevation {number}
         */
        Coordinate.prototype.setElevation = function (elevation) {
            this.elevation = elevation;
        };
        /**
         * 最大化 / 最小化の切り替えのため，{-1, 1} をとる MAXIMIZATION をかける
         *
         * @returns {number}
         */
        Coordinate.prototype.getElevation = function () {
            return this.elevation * MAXIMIZATION;
        };
        /**
         * 元の座業に対して，Vector を足す
         * 座標系からはみ出した分はよしなに変換する
         *
         * @param vector {Vector}
         */
        Coordinate.prototype.plusVector = function (vector) {
            // 大円にそって進む
            this.latitude += vector.y;
            this.longitude += vector.x / Math.cos(this.latitude * Math.PI / 180);
            // 座標が直交座標系からはみ出たときの変換
            var i = 0;
            while (this.longitude < -180 || 180 < this.longitude || this.latitude < -90 || 90 < this.latitude) {
                this.longitude = Coordinate.positiveMod(this.longitude + 180, 360) - 180;
                if (this.latitude < -90 || 90 < this.latitude) {
                    if (this.latitude < -90) {
                        this.latitude = -180 - this.latitude;
                    }
                    else if (90 < this.latitude) {
                        this.latitude = 180 - this.latitude;
                    }
                    if (0 <= this.longitude) {
                        this.longitude -= 180;
                    }
                    else {
                        this.longitude += 180;
                    }
                }
                // 念のため無限ループ回避
                if (30 < i++) {
                    console.log("Break");
                    console.log(this);
                    break;
                }
            }
            // 四捨五入
            this.longitude = Math.round(this.longitude * ROUND) / ROUND;
            this.latitude = Math.round(this.latitude * ROUND) / ROUND;
        };
        /**
         * ランダムで座標を生成する
         *
         * @returns {Coordinate}
         */
        Coordinate.randomConstruct = function () {
            var MIN_LNG = -180;
            var MAX_LNG = 180;
            var MIN_LAT = -90;
            var MAX_LAT = 90;
            var longitude = (MAX_LNG - MIN_LNG) * Math.random() + MIN_LNG;
            var latitude = (MAX_LAT - MIN_LAT) * Math.random() + MIN_LAT;
            return new Coordinate(longitude, latitude, null);
        };
        /**
         * 正の mod を返す
         * JavaScript の % は -190 % 180 = -10 と返すが
         * positiveMod は -190 % 180 = 170 と返す
         *
         * @param a
         * @param b
         * @returns {number}
         */
        Coordinate.positiveMod = function (a, b) {
            var tmp = a - b * Math.floor(a / b);
            if (tmp < 0) {
                return tmp + b;
            }
            return tmp;
        };
        return Coordinate;
    })();
    _Coordinate.Coordinate = Coordinate;
    /**
     * 点の移動を扱うクラス
     * 経度，緯度方向へのそれぞれの移動距離を長さで持つ
     */
    var Vector = (function () {
        /**
         * @param x {number}
         * @param y {number}
         */
        function Vector(x, y) {
            this.x = x;
            this.y = y;
        }
        /**
         * @param fromCoordinate {Coordinate}
         * @param toCoordinate {Coordinate}
         * @returns {Vector}
         */
        Vector.constructWithCoordinate = function (fromCoordinate, toCoordinate) {
            var y = fromCoordinate.latitude - toCoordinate.latitude;
            var x = (fromCoordinate.longitude - toCoordinate.longitude) * Math.cos(toCoordinate.latitude * Math.PI / 180);
            return new Vector(x, y);
        };
        /**
         * アルゴリズムは往々にして速度が早くなりすぎると精度が低下するため，最高速を設定する
         */
        Vector.prototype.ceilVector = function () {
            var MAX_DISTANCE = 180;
            if (this.x > MAX_DISTANCE || this.y > MAX_DISTANCE) {
                var rate = MAX_DISTANCE / Math.max(this.x, this.y);
                this.x = this.x * rate;
                this.y = this.y * rate;
            }
        };
        return Vector;
    })();
    _Coordinate.Vector = Vector;
})(Coordinate || (Coordinate = {}));
//# sourceMappingURL=coordinate.js.map