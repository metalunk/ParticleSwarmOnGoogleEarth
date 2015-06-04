/**
 * ParticleSwarm
 */
module ParticleSwarm {
    const LOOP_MAX = 10;
    const N_PARTICLE = 10;
    const INERTIA = 0.9;
    const C1_RATE = 0.9;
    const C2_RATE = 0.9;

    /**
     * 座標と標高を扱う Class
     */
    class Coordinate {
        longitude:number;
        latitude:number;
        elevation:number = null;

        constructor(longitude:number, latitude:number, elevation:number = null) {
            this.longitude = longitude;
            this.latitude = latitude;
            if (elevation !== null) {
                this.elevation = elevation;
            }
        }

        /**
         * ランダムで座標を生成する
         *
         * @returns {Coordinate}
         */
        public static randomConstruct() {
            const MIN_LONG = -180;
            const MAX_LONG = 180;
            const MIN_LAT = -90;
            const MAX_LAT = 90;

            var longitude = (MAX_LONG - MIN_LONG) * Math.random() + MIN_LONG;
            var latitude = (MAX_LAT - MIN_LAT) * Math.random() + MIN_LAT;
            return new Coordinate(longitude, latitude);
        }

        /**
         * 座標をよしなに変換しながら足す
         *
         * @param vector {Coordinate}
         * @returns {Coordinate}
         */
        plusCoordinate(vector:Coordinate) {
            this.longitude += vector.longitude;
            this.latitude += vector.latitude;
        }
    }

    /**
     * Particle
     */
    class Particle {
        coordinate:Coordinate;
        localBestCoordinate:Coordinate = null;
        vector = new Coordinate(0, 0);

        /**
         * @param coordinate {Coordinate}
         */
        constructor(coordinate:Coordinate) {
            this.coordinate = coordinate;
        }

        /**
         * 標高を更新する
         * 自己最良を更新したら現在の座標で localBestCoordinate も更新する
         *
         * @param elevation
         */
        updateElevation(elevation:number) {
            if (this.localBestCoordinate === null || this.localBestCoordinate.elevation <= elevation) {
                this.localBestCoordinate = new Coordinate(
                    this.coordinate.longitude, this.coordinate.latitude, elevation
                );
            }
            this.coordinate.elevation = elevation;
        }

        /**
         * vector を更新する
         *
         * @param bestCoordinate {Coordinate}
         */
        calcVector(bestCoordinate:Coordinate) {
            this.vector.longitude = INERTIA * this.vector.longitude +
                C1_RATE * Math.random() * (this.localBestCoordinate.longitude - this.coordinate.longitude) +
                C2_RATE * Math.random() * (bestCoordinate.longitude - this.coordinate.longitude);
            this.vector.latitude = INERTIA * this.vector.latitude +
                C1_RATE * Math.random() * (this.localBestCoordinate.latitude - this.coordinate.latitude) +
                C2_RATE * Math.random() * (bestCoordinate.latitude - this.coordinate.latitude);
        }

        /**
         * 座標を更新する
         */
        moveToNext() {
            this.coordinate.plusCoordinate(this.vector);
        }
    }

    /**
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
     * すべての Particle について標高を取得し，更新する
     *
     * @param particles {Particle[]}
     * @returns {Particle[]}
     */
    function updateElevations(particles:Particle[]) {
        for (var i = 0; i < particles.length; i++) {
            particles[i].updateElevation(Math.random()); // TODO
        }
        return particles;
    }

    /**
     * main
     */
    export function main() {
        var particles = initializeParticle();
        var bestCoordinate:Coordinate = null;

        for (var i = 0; i < LOOP_MAX; i++) {
            particles = updateElevations(particles);

            // TODO : 描画

            // 全体の最良地点を求める
            for (var j = 0; j < particles.length; j++) {
                if (bestCoordinate === null || bestCoordinate.elevation < particles[j].coordinate.elevation) {
                    var tmpCoordinate = particles[j].coordinate;
                    bestCoordinate = new Coordinate(
                        tmpCoordinate.longitude, tmpCoordinate.latitude, tmpCoordinate.elevation
                    );
                }
            }

            // それぞれの Particle について，vector を求め，次の座標を決定する
            for (var j = 0; j < particles.length; j++) {
                particles[j].calcVector(bestCoordinate);
                particles[j].moveToNext();
            }

            // TODO : 描画
        }

        // TODO : 最良点の情報を出力
    }
}
