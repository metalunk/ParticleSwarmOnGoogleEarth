/// <reference path="google_earth.ts"/>
/// <reference path="coordinate.ts"/>
/**
 * ParticleSwarm
 */
var ParticleSwarm;
(function (ParticleSwarm) {
    var LOOP_MAX = 30;
    var N_PARTICLE = 10; // ひとまず Google Elevation API の一度の最大リクエスト数である 512 まで
    var INERTIA = 0.4;
    var C1_RATE = 1.5; // 郡の最良点方向へ向かう割合
    var C2_RATE = 2.0; // 自分の最良点方向へ向かう割合
    var ge;
    /**
     * 点についての情報を扱う Class
     */
    var Particle = (function () {
        /**
         * @param coordinate {Coordinate}
         */
        function Particle(coordinate) {
            this.localBestCoordinate = null;
            this.vector = new Coordinate.Vector(0, 0);
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
                this.localBestCoordinate = new Coordinate.Coordinate(this.coordinate.longitude, this.coordinate.latitude, elevation);
            }
            this.coordinate.setElevation(elevation);
        };
        /**
         * vector を更新する
         *
         * @param bestCoordinate {Coordinate}
         */
        Particle.prototype.calcVector = function (bestCoordinate) {
            var vectorL = Coordinate.Vector.constructWithCoordinate(this.localBestCoordinate, this.coordinate);
            var vectorG = Coordinate.Vector.constructWithCoordinate(bestCoordinate, this.coordinate);
            this.vector.x = INERTIA * this.vector.x + C1_RATE * Math.random() * vectorL.x + C2_RATE * Math.random() * vectorG.x;
            this.vector.y = INERTIA * this.vector.y + C1_RATE * Math.random() * vectorL.y + C2_RATE * Math.random() * vectorG.y;
            // メモリ開放の方法いいのないのか
            vectorL = null;
            vectorG = null;
            // 速度が早くなりすぎると精度が低下するため，最高速を設定する
            this.vector.ceilVector();
        };
        /**
         * 座標を更新する
         */
        Particle.prototype.moveToNext = function () {
            this.previousCoordinate = new Coordinate.Coordinate(this.coordinate.longitude, this.coordinate.latitude, this.coordinate.getElevation());
            this.coordinate.plusVector(this.vector);
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
            particles[i] = new Particle(Coordinate.Coordinate.randomConstruct());
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
            for (var j = 0; j < particles.length; j++) {
                if (bestCoordinate === null || bestCoordinate.getElevation() < particles[j].coordinate.getElevation()) {
                    var tmpCoordinate = particles[j].coordinate;
                    bestCoordinate = new Coordinate.Coordinate(tmpCoordinate.longitude, tmpCoordinate.latitude, tmpCoordinate.getElevation());
                }
            }
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
        var particles = initializeParticle();
        promise.done(function () {
            moveSwarm(ge, 0, particles, null);
        });
    }
    ParticleSwarm.main = main;
})(ParticleSwarm || (ParticleSwarm = {}));
//# sourceMappingURL=particle_swarm.js.map