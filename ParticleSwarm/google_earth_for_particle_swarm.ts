/// <reference path="../Util/google_earth.ts" />
/// <reference path="particle_swarm.ts"/>

declare var google;
var jQuery;

class GoogleEarthForParticleSwarm extends GoogleEarth {
    /**
     * 複数の Particle を受け取り，まとめてリクエストを送る
     * Google Elevation API は非同期処理となっているため，Promise オブジェクトを返しておき
     * 標高データの受信が完了したら Deferred オブジェクトを完了する
     * TODO : リクエストは最大 512 点だから，それを考慮する
     *
     * @param particles {ParticleSwarm.Particle[]}
     * @returns {object}
     */
    static getElevationForParticles(particles:ParticleSwarm.Particle[]) {
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

    /**
     * 点の移動を表す矢印（いまのところただの直線）を描画する
     *
     * @param particles {ParticleSwarm.Particle[]}
     */
    drawArrowForParticles(particles:ParticleSwarm.Particle[]) {
        for (var i = 0; i < particles.length; i++) {
            var polygonPlacemark = this.ge.createPlacemark('');
            var polygon = this.ge.createPolygon('');
            polygonPlacemark.setGeometry(polygon);
            polygon.setAltitudeMode(this.ge.ALTITUDE_CLAMP_TO_SEA_FLOOR);
            var outer = this.ge.createLinearRing('');
            outer.getCoordinates().pushLatLngAlt(
                particles[i].previousCoordinate.latitude, particles[i].previousCoordinate.longitude, 0
            );
            outer.getCoordinates().pushLatLngAlt(
                particles[i].coordinate.latitude, particles[i].coordinate.longitude, 0
            );
            polygon.setOuterBoundary(outer);
            polygonPlacemark.setStyleSelector(this.ge.createStyle(''));
            var lineStyle = polygonPlacemark.getStyleSelector().getLineStyle();
            lineStyle.setWidth(2);
            lineStyle.getColor().set('9900ffff');
            this.ge.getFeatures().appendChild(polygonPlacemark);
        }

        polygonPlacemark = null;
        polygon = null;
        outer = null;
        lineStyle = null;
    }
}
