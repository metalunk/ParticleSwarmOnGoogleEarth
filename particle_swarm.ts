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

        constructor(longitude:number, latitude:number) {
            this.longitude = longitude;
            this.latitude = latitude;
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
         * @param coordinate {Coordinate}
         * @param vector {Coordinate}
         * @returns {Coordinate}
         */
        static plusCoordinate(coordinate:Coordinate, vector:Coordinate) {
            coordinate.longitude += vector.longitude;
            coordinate.latitude += vector.latitude;
            return coordinate;
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
         * @param coordinate
         */
        updateElevation(coordinate:Coordinate) {
            if (this.localBestCoordinate === null || this.localBestCoordinate.elevation <= coordinate.elevation) {
                this.localBestCoordinate = coordinate;
            }
            this.coordinate = coordinate;
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
            this.coordinate = Coordinate.plusCoordinate(this.coordinate, this.vector);
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
            var coordinate = particles[i].coordinate;
            // coordinate.elevation = Math.random();
            coordinate.elevation++;
            particles[i].updateElevation(coordinate); // TODO
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
            if (bestCoordinate !== null) {
                console.log("before : " + bestCoordinate.elevation);
            }
            particles = updateElevations(particles);
            if (bestCoordinate !== null) {
                console.log("after : " + bestCoordinate.elevation);
            }

            // TODO : 描画

            // 全体の最良地点を求める
            for (var j = 0; j < particles.length; j++) {
                if (bestCoordinate === null || bestCoordinate.elevation < particles[j].coordinate.elevation) {
                    bestCoordinate = particles[j].coordinate;
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
