/// <reference path="../Util/google_earth.ts" />
/// <reference path="nelder_mead.ts"/>

declare var google;
var jQuery;

class GoogleEarthForNelderMead extends GoogleEarth {
    /**
     * 複数の Particle を受け取り，まとめてリクエストを送る
     * Google Elevation API は非同期処理となっているため，Promise オブジェクトを返しておき
     * 標高データの受信が完了したら Deferred オブジェクトを完了する
     * TODO : リクエストは最大 512 点だから，それを考慮する
     *
     * @param simplex {NelderMead.Simplex}
     * @returns {object}
     */
    static getElevationForSimplex(simplex:NelderMead.Simplex) {
        var locations = [];
        var elevator = new google.maps.ElevationService();
        particles.forEach(function (particle) {
            locations.push(new google.maps.LatLng(
                particle.coordinate.latitude, particle.coordinate.longitude
            ));
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
            } else {
                console.log("Elevation service failed due to: " + status);
                console.log(particles);
            }
            deferred.resolve();
        });

        locations = null;
        elevator = null;
        positionalRequest = null;

        return deferred.promise();
    }

    static drawSimplex(simplex:NelderMead.Simplex) {
        // TODO
    }
}
