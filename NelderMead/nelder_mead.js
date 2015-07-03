/// <reference path="../Util/google_earth.ts" />
/// <reference path="../Util/coordinate.ts" />
/// <reference path="google_earth_for_nelder_mead.ts" />
/**
 * NelderMead
 */
var NelderMead;
(function (NelderMead) {
    var N = 3; // 単体の頂点数
    var LOOP_MAX = 5; // NelderMead 法は収束性が証明されているが，念のため
    var MIN_SPACE = 1000000; // 終了条件となる単体の面積
    var MIN_INITIAL_SPACE = 10000000000000; // 初期単体の最小面積
    var ge;
    /**
     * 単体を扱うクラス
     */
    var Simplex = (function () {
        /**
         * @param coordinates {Coordinate.Coordinate[]}
         */
        function Simplex(coordinates) {
            for (var i = 0; i < N; i++) {
                this.vertexes[i] = coordinates[i];
            }
        }
        /**
         * 現在の単体から，NelderMead 法によって候補点を挙げる
         */
        Simplex.prototype.listUpCandidate = function () {
            // TODO
            this.reflectionPoint = new Coordinate.Coordinate(0, 0, null);
            this.expandPoint = new Coordinate.Coordinate(0, 0, null);
            this.outsideContractPoint = new Coordinate.Coordinate(0, 0, null);
            this.insideContractPoint = new Coordinate.Coordinate(0, 0, null);
        };
        /**
         * Shrink の操作を行う
         */
        Simplex.prototype.shrink = function () {
            // TODO
        };
        /**
         * 単体の変形を行う
         */
        Simplex.prototype.updateSimplex = function () {
            // TODO
            this.vertexes[0] = this.reflectionPoint;
            this.shrink();
        };
        /**
         * 現在の単体の面積を計算する
         *
         * @returns {number}
         */
        Simplex.prototype.calcSpace = function () {
            // TODO
            return MIN_SPACE + 1;
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
            } while (simplex.calcSpace() < MIN_INITIAL_SPACE);
            return simplex;
        };
        return Simplex;
    })();
    NelderMead.Simplex = Simplex;
    /**
     * 終了時に実行
     */
    function finish() {
        // 描画
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
            GoogleEarthForNelderMead.drawSimplex(simplex);
            if (simplex.calcSpace() < MIN_SPACE) {
                finish();
            }
            else {
                if (loop > LOOP_MAX) {
                    finish();
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