/// <reference path="../Util/google_earth.ts" />
/// <reference path="../Util/coordinate.ts" />
/// <reference path="google_earth_for_nelder_mead.ts" />
/**
 * NelderMead
 */
var NelderMead;
(function (NelderMead) {
    var N = 3; // 単体の頂点数
    var LOOP_MAX = 50; // NelderMead 法は収束性が証明されているが，念のため
    var MIN_SPACE = 1000; // 終了条件となる単体の面積
    var MIN_INITIAL_SPACE = 10000000000000; // 初期単体の最小面積
    var R0 = 6378137; // 地球の半径
    var ALPHA = 1.0; // Reflect
    var BETA = 2.0; // Expand
    var GAMMA = 0.5; // Outside Contract
    var DELTA = -0.5; // Inside Contract
    var EPSILON = 0.5; // Shrink
    var ge;
    /**
     * 単体を扱うクラス
     */
    var Simplex = (function () {
        /**
         * @param coordinates {Coordinate.Coordinate[]}
         */
        function Simplex(coordinates) {
            this.vertexes = [];
            for (var i = 0; i < N; i++) {
                this.vertexes[i] = coordinates[i];
            }
        }
        /**
         * 現在の単体から，NelderMead 法によって候補点を挙げる
         */
        Simplex.prototype.listUpCandidate = function () {
            if (this.vertexes[0].getElevation() === null) {
                // 初回は標高の取得が終わっていないためスキップ
                return;
            }
            // 最良点以外の点の重心を求める
            var cgravLat = 0;
            var cgravLng = 0;
            for (var i = 0; i < N; i++) {
                cgravLat += this.vertexes[i].latitude;
                cgravLng += this.vertexes[i].longitude;
            }
            var cgrav = new Coordinate.Coordinate(cgravLng / N, cgravLat / N, null);
            // 最良点から重心へ向かうベクトルを定義する
            var defaultVector = Coordinate.Vector.constructWithCoordinate(this.vertexes[0], cgrav);
            var reflectionVector = new Coordinate.Vector(defaultVector.x * ALPHA, defaultVector.y * ALPHA);
            this.reflectionPoint = new Coordinate.Coordinate(cgrav.longitude, cgrav.latitude, null);
            this.reflectionPoint.plusVector(reflectionVector);
            var expandVector = new Coordinate.Vector(defaultVector.x * BETA, defaultVector.y * BETA);
            this.expandPoint = new Coordinate.Coordinate(cgrav.longitude, cgrav.latitude, null);
            this.expandPoint.plusVector(expandVector);
            var outsideContractVector = new Coordinate.Vector(defaultVector.x * GAMMA, defaultVector.y * GAMMA);
            this.outsideContractPoint = new Coordinate.Coordinate(cgrav.longitude, cgrav.latitude, null);
            this.outsideContractPoint.plusVector(outsideContractVector);
            var insideContractVector = new Coordinate.Vector(defaultVector.x * DELTA, defaultVector.y * DELTA);
            this.insideContractPoint = new Coordinate.Coordinate(cgrav.longitude, cgrav.latitude, null);
            this.insideContractPoint.plusVector(insideContractVector);
            this.shrinkPoints = [];
            for (var i = 0; i < N - 1; i++) {
                this.shrinkPoints[i] = new Coordinate.Coordinate((this.vertexes[0].longitude + this.vertexes[i + 1].longitude) * EPSILON, (this.vertexes[0].latitude + this.vertexes[i + 1].latitude) * EPSILON);
            }
        };
        /**
         * 単体の頂点を目的関数地が良い順に並び替える
         */
        Simplex.prototype.sortVertex = function () {
            this.vertexes.sort(function (a, b) {
                return a.getElevation() > b.getElevation() ? -1 : 1;
            });
        };
        /**
         * Shrink
         */
        Simplex.prototype.shrink = function () {
            for (var i = 0; i < N - 1; i++) {
                this.vertexes[i + 1] = this.shrinkPoints[i];
            }
            this.sortVertex();
        };
        /**
         * 単体の変形を行う
         */
        Simplex.prototype.updateSimplex = function () {
            // 目的関数値が良い順に頂点を並べる
            this.sortVertex();
            if (this.reflectionPoint === null || this.expandPoint === null || this.outsideContractPoint === null || this.insideContractPoint === null) {
                // 初回は候補点がないため変形をしない
                return;
            }
            if (this.reflectionPoint.getElevation() > this.vertexes[0].getElevation()) {
                if (this.expandPoint.getElevation() > this.vertexes[0].getElevation()) {
                    // Expand
                    this.vertexes[N - 1] = this.expandPoint;
                    this.sortVertex();
                    return;
                }
                // Reflect
                this.vertexes[N - 1] = this.reflectionPoint;
                this.sortVertex();
                return;
            }
            else if (this.reflectionPoint.getElevation() > this.vertexes[N - 1].getElevation() && this.reflectionPoint.getElevation() <= this.vertexes[N - 2].getElevation()) {
                if (this.outsideContractPoint.getElevation() < this.reflectionPoint.getElevation()) {
                    this.shrink();
                    return;
                }
                // Outside Contract
                this.vertexes[N - 1] = this.outsideContractPoint;
                this.sortVertex();
                return;
            }
            else if (this.reflectionPoint.getElevation() <= this.vertexes[N - 1].getElevation() && this.reflectionPoint.getElevation() <= this.vertexes[N - 2].getElevation()) {
                if (this.insideContractPoint.getElevation() < this.reflectionPoint.getElevation()) {
                    this.shrink();
                    return;
                }
                // Inside Contract
                this.vertexes[N - 1] = this.insideContractPoint;
                this.sortVertex();
                return;
            }
            this.shrink();
        };
        /**
         * FIXME
         * 現在の単体の面積を計算する
         * この関数は N = 3 であると仮定して三角形の面積を計算しているため，N は変化させることはできない
         *
         * @returns {number}
         */
        Simplex.prototype.calcSpace = function () {
            var vectors = [];
            for (var i = 0; i < N; i++) {
                vectors[i] = [];
                var latRadian = this.vertexes[i].latitude * Math.PI / 180;
                var lngRadian = this.vertexes[i].longitude * Math.PI / 180;
                vectors[i][0] = R0 * Math.cos(latRadian) * Math.cos(lngRadian);
                vectors[i][1] = R0 * Math.sin(latRadian) * Math.sin(lngRadian);
                vectors[i][2] = R0 * Math.cos(lngRadian);
            }
            var vectorA = []; // 頂点0から頂点1へ向かうベクトル
            var vectorB = []; // 頂点0から頂点2へ向かうベクトル
            for (var i = 0; i < N; i++) {
                vectorA[i] = vectors[1][i] - vectors[0][i];
                vectorB[i] = vectors[2][i] - vectors[0][i];
            }
            // vectorA と vectorB がなす面積の大きさを計算する
            return Math.sqrt((Math.pow(vectorA[0], 2) + Math.pow(vectorA[1], 2) + Math.pow(vectorA[2], 2)) * (Math.pow(vectorB[0], 2) + Math.pow(vectorB[1], 2) + Math.pow(vectorB[2], 2)) - Math.pow(vectorA[0] * vectorB[0] + vectorA[1] * vectorB[1] + vectorA[2] * vectorB[2], 2)) / 2;
        };
        /**
         * 初期単体をランダムに生成する
         * 初期単体が小さすぎると十分に探索できないため，閾値より大きい面積を持つ単体を生成する
         *
         * @returns {NelderMead.Simplex}
         */
        Simplex.randomConstructor = function () {
            var coordinates = [];
            var simplex;
            do {
                for (var i = 0; i < N; i++) {
                    coordinates[i] = Coordinate.Coordinate.randomConstruct();
                }
                simplex = new Simplex(coordinates);
                console.log(simplex.calcSpace());
            } while (simplex.calcSpace() < MIN_INITIAL_SPACE);
            return simplex;
        };
        return Simplex;
    })();
    NelderMead.Simplex = Simplex;
    /**
     * 終了時に実行
     */
    function finish(simplex) {
        // TODO
        console.log(simplex);
    }
    /**
     * 再帰しながら単体を更新する
     *
     * @param ge {GoogleEarthForNelderMead}
     * @param loop {number}
     * @param simplex {Simplex}
     */
    function nelderMead(ge, loop, simplex) {
        simplex.listUpCandidate();
        var promise = GoogleEarthForNelderMead.getElevationForSimplex(simplex);
        promise.done(function () {
            simplex.updateSimplex();
            ge.drawSimplex(simplex.vertexes);
            if (simplex.calcSpace() < MIN_SPACE) {
                finish(simplex);
            }
            else {
                if (loop > LOOP_MAX) {
                    finish(simplex);
                }
                else {
                    nelderMead(ge, ++loop, simplex);
                }
            }
        });
    }
    /**
     * main
     */
    function main() {
        ge = new GoogleEarthForNelderMead();
        var promise = ge.initializeEarth();
        var simplex = Simplex.randomConstructor();
        promise.done(function () {
            nelderMead(ge, 0, simplex);
        });
    }
    NelderMead.main = main;
})(NelderMead || (NelderMead = {}));
//# sourceMappingURL=nelder_mead.js.map