/// <reference path="particle_swarm.ts"/>

declare
var google;
var jQuery;

class GoogleEarth {
    ZOOM = 10000000;
    private ge;

    /**
     * Google Earth の初期化処理
     */
    initializeEarth() {
        var deferred = jQuery.Deferred();
        google.earth.createInstance(
            'map3d',
            (instance) => {
                this.ge = instance;
                this.ge.getWindow().setVisibility(true);
                deferred.resolve();
            },
            (errorCode) => {
                alert("Google Earth でエラーが発生しました (errorCode : " + errorCode + ")");
            }
        );
        return deferred.promise();
    }

    /**
     * 複数の Particle を受け取り，まとめてリクエストを送る
     * Google Elevation API は非同期処理となっているため，Promise オブジェクトを返しておき
     * 標高データの受信が完了したら Deferred オブジェクトを完了する
     * TODO : リクエストは最大 512 点だから，それを考慮する
     *
     * @param particles {ParticleSwarm.Particle[]}
     * @returns {object}
     */
    static getElevations(particles:ParticleSwarm.Particle[]) {
        var locations = [];
        var elevator = new google.maps.ElevationService();
        particles.forEach(function (particle) {
            var requestedLocation = new google.maps.LatLng(
                particle.coordinate.latitude, particle.coordinate.longitude
            );
            locations.push(requestedLocation);
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
        return deferred.promise();
    }

    /**
     * 点の移動を表す矢印（いまのところただの直線）を描画する
     *
     * @param particles {ParticleSwarm.Particle[]}
     */
    drawArrows(particles:ParticleSwarm.Particle[]) {
        for (var i = 0; i < particles.length; i++) {
            var lineStringPlacemark = this.ge.createPlacemark('');
            var lineString = this.ge.createLineString('');
            lineString.getCoordinates().pushLatLngAlt(
                particles[i].previousCoordinate.latitude, particles[i].previousCoordinate.longitude, 0
            );
            lineString.getCoordinates().pushLatLngAlt(
                particles[i].coordinate.latitude, particles[i].coordinate.longitude, 0
            );
            lineStringPlacemark.setGeometry(lineString);
            this.ge.getFeatures().appendChild(lineStringPlacemark);
        }
    }

    /**
     * @param coordinate {ParticleSwarm.Coordinate}
     */
    drawResult(coordinate:ParticleSwarm.Coordinate) {
        var placemark = this.ge.createPlacemark('');
        placemark.setName("Optimal Value : " + coordinate.getElevation() + " meters.");
        var style = this.ge.createStyle(''); //create a new style
        style.getIconStyle().setScale(6.0);
        placemark.setStyleSelector(style); //apply the style to the placemark
        var point = this.ge.createPoint('');
        point.setLatitude(coordinate.latitude);
        point.setLongitude(coordinate.longitude);
        placemark.setGeometry(point);
        this.ge.getFeatures().appendChild(placemark);

        var lookAt = this.ge.createLookAt('');
        lookAt.setLatitude(coordinate.latitude);
        lookAt.setLongitude(coordinate.longitude);
        lookAt.setRange(this.ZOOM);
        this.ge.getView().setAbstractView(lookAt);
    }
}
