/// <reference path="../Util/google_earth.ts" />
/// <reference path="nelder_mead.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var jQuery;
var GoogleEarthForNelderMead = (function (_super) {
    __extends(GoogleEarthForNelderMead, _super);
    function GoogleEarthForNelderMead() {
        _super.apply(this, arguments);
    }
    /**
     * 複数の Particle を受け取り，まとめてリクエストを送る
     * Google Elevation API は非同期処理となっているため，Promise オブジェクトを返しておき
     * 標高データの受信が完了したら Deferred オブジェクトを完了する
     * TODO : リクエストは最大 512 点だから，それを考慮する
     *
     * @param simplex {NelderMead.Simplex}
     * @returns {object}
     */
    GoogleEarthForNelderMead.getElevationForSimplex = function (simplex) {
        var locations = [];
        var elevator = new google.maps.ElevationService();
        particles.forEach(function (particle) {
            locations.push(new google.maps.LatLng(particle.coordinate.latitude, particle.coordinate.longitude));
        });
        var positionalRequest = {
            'locations': locations
        };
        var deferred = jQuery.Deferred();
        elevator.getElevationForLocations(positionalRequest, function (results, status) {
            if (status === google.maps.ElevationStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    particles[i].updateElevation(results[i].elevation);
                }
            }
            else {
                console.log("Elevation service failed due to: " + status);
                console.log(particles);
            }
            deferred.resolve();
        });
        locations = null;
        elevator = null;
        positionalRequest = null;
        return deferred.promise();
    };
    GoogleEarthForNelderMead.drawSimplex = function (simplex) {
        // TODO
    };
    return GoogleEarthForNelderMead;
})(GoogleEarth);
//# sourceMappingURL=google_earth_for_nelder_mead.js.map