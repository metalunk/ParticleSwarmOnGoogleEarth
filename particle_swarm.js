/// <reference path="google_earth.ts"/>
/**
 * ParticleSwarm
 */
var ParticleSwarm;
(function (ParticleSwarm) {
    var LOOP_MAX = 40;
    var N_PARTICLE = 20; // ひとまず Google Elevation API の一度の最大リクエスト数である 512 まで
    var INERTIA = 0.9;
    var C1_RATE = 0.9;
    var C2_RATE = 0.9;
    var MAXIMIZATION = 1; // {-1, 1}
    var ROUND = 100000000;
    var ge;
    /**
     * 座標と標高を扱う Class
     */
    var Coordinate = (function () {
        function Coordinate(longitude, latitude, elevation) {
            if (elevation === void 0) { elevation = null; }
            this.elevation = null;
            this.longitude = longitude;
            this.latitude = latitude;
            if (elevation !== null) {
                this.elevation = elevation;
            }
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
         * 座標をよしなに変換しながら足す
         * TODO : 変換が正しいのか確認する
         *
         * @param vector {Coordinate}
         * @returns {Coordinate}
         */
        Coordinate.prototype.plusCoordinate = function (vector) {
            this.longitude += vector.longitude;
            this.latitude += vector.latitude;
            // 座標が直交座標系からはみ出たときの変換
            var i = 0;
            while (this.longitude < -180 || 180 < this.longitude || this.latitude < -90 || 90 < this.latitude) {
                this.longitude = Coordinate.positiveMod(this.longitude + 180, 360) - 180;
                if (this.latitude < -90 || 90 < this.latitude) {
                    if (this.latitude < -90) {
                        this.latitude = -90 - this.latitude % (-90);
                    }
                    else if (90 < this.latitude) {
                        this.latitude = 90 - this.latitude % 90;
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
            var MIN_LONG = -180;
            var MAX_LONG = 180;
            var MIN_LAT = -90;
            var MAX_LAT = 90;
            var longitude = (MAX_LONG - MIN_LONG) * Math.random() + MIN_LONG;
            var latitude = (MAX_LAT - MIN_LAT) * Math.random() + MIN_LAT;
            return new Coordinate(longitude, latitude);
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
    ParticleSwarm.Coordinate = Coordinate;
    /**
     * 点についての情報を扱う Class
     */
    var Particle = (function () {
        /**
         * @param coordinate {Coordinate}
         */
        function Particle(coordinate) {
            this.localBestCoordinate = null;
            this.vector = new Coordinate(0, 0);
            this.coordinate = coordinate;
        }
        /**
         * 標高を更新する
         * 自己最良を更新したら現在の座標で localBestCoordinate も更新する
         *
         * @param elevation
         */
        Particle.prototype.updateElevation = function (elevation) {
            if (this.localBestCoordinate === null || this.localBestCoordinate.getElevation() <= elevation) {
                this.localBestCoordinate = new Coordinate(this.coordinate.longitude, this.coordinate.latitude, elevation);
            }
            this.coordinate.setElevation(elevation);
        };
        /**
         * vector を更新する
         *
         * @param bestCoordinate {Coordinate}
         */
        Particle.prototype.calcVector = function (bestCoordinate) {
            this.vector.longitude = INERTIA * this.vector.longitude +
                C1_RATE * Math.random() * (this.localBestCoordinate.longitude - this.coordinate.longitude) +
                C2_RATE * Math.random() * (bestCoordinate.longitude - this.coordinate.longitude);
            this.vector.latitude = INERTIA * this.vector.latitude +
                C1_RATE * Math.random() * (this.localBestCoordinate.latitude - this.coordinate.latitude) +
                C2_RATE * Math.random() * (bestCoordinate.latitude - this.coordinate.latitude);
        };
        /**
         * 座標を更新する
         */
        Particle.prototype.moveToNext = function () {
            this.previousCoordinate = new Coordinate(this.coordinate.longitude, this.coordinate.latitude, this.coordinate.getElevation());
            this.coordinate.plusCoordinate(this.vector);
        };
        return Particle;
    })();
    ParticleSwarm.Particle = Particle;
    /**
     * 点群の初期化を行う
     *
     * @returns {Particle[]}
     */
    function initializeParticle() {
        var particles = [];
        for (var i = 0; i < N_PARTICLE; i++) {
            particles[i] = new Particle(Coordinate.randomConstruct());
        }
        return particles;
    }
    /**
     * 最終結果の出力
     *
     * @param ge {GoogleEarth}
     * @param bestCoordinate
     */
    function finish(ge, bestCoordinate) {
        ge.drawResult(bestCoordinate);
        console.log("finish!");
        console.log(bestCoordinate);
    }
    /**
     * 点群の更新とそれの描画を再帰的に行う
     *
     * @param ge {GoogleEarth}
     * @param loop {number}
     * @param particles {Particle[]}
     * @param bestCoordinate {Coordinate}
     */
    function moveSwarm(ge, loop, particles, bestCoordinate) {
        var promise = GoogleEarth.getElevations(particles);
        promise.done(function () {
            // 全体の最良地点を求める
            for (var j = 0; j < particles.length; j++) {
                if (bestCoordinate === null || bestCoordinate.getElevation() < particles[j].coordinate.getElevation()) {
                    var tmpCoordinate = particles[j].coordinate;
                    bestCoordinate = new Coordinate(tmpCoordinate.longitude, tmpCoordinate.latitude, tmpCoordinate.getElevation());
                }
            }
            // TODO : 最良点の描画
            // それぞれの Particle について，vector を求め，次の座標を決定する
            for (var j = 0; j < particles.length; j++) {
                particles[j].calcVector(bestCoordinate);
                particles[j].moveToNext();
            }
            ge.drawArrows(particles);
            loop++;
            if (loop < LOOP_MAX) {
                moveSwarm(ge, loop, particles, bestCoordinate);
            }
            else {
                finish(ge, bestCoordinate);
            }
        });
    }
    /**
     * main
     */
    function main() {
        ge = new GoogleEarth();
        var promise = ge.initializeEarth();
        promise.done(function () {
            moveSwarm(ge, 0, initializeParticle(), null);
        });
    }
    ParticleSwarm.main = main;
})(ParticleSwarm || (ParticleSwarm = {}));
