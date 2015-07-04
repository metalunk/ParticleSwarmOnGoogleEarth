/// <reference path="../Util/google_earth.ts" />
/// <reference path="nelder_mead.ts"/>

declare var google;
var jQuery;

class GoogleEarthForNelderMead extends GoogleEarth {
    RANGE_MAX = 10000000;

    /**
     * Simplex を受け取り，単体の頂点と候補点について標高を取得する
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
        simplex.vertexes.forEach(function (coordinate:Coordinate.Coordinate) {
            locations.push(new google.maps.LatLng(
                coordinate.latitude, coordinate.longitude
            ));
        });
        if (simplex.reflectionPoint !== null && simplex.expandPoint !== null &&
            simplex.insideContractPoint !== null && simplex.outsideContractPoint !== null &&
            simplex.shrinkPoints !== []
        ) {
            locations.push(new google.maps.LatLng(
                simplex.reflectionPoint.latitude, simplex.reflectionPoint.longitude
            ));
            locations.push(new google.maps.LatLng(
                simplex.expandPoint.latitude, simplex.expandPoint.longitude
            ));
            locations.push(new google.maps.LatLng(
                simplex.insideContractPoint.latitude, simplex.insideContractPoint.longitude
            ));
            locations.push(new google.maps.LatLng(
                simplex.outsideContractPoint.latitude, simplex.outsideContractPoint.longitude
            ));
            for (var i = 0; i < simplex.shrinkPoints.length; i++) {
                locations.push(new google.maps.LatLng(
                    simplex.shrinkPoints[i].latitude, simplex.shrinkPoints[i].longitude
                ));
            }
        }
        var positionalRequest = {
            'locations': locations
        };
        var deferred = jQuery.Deferred();
        elevator.getElevationForLocations(positionalRequest, function (results, status) {
            if (status === google.maps.ElevationStatus.OK) {
                var i = 0;
                for (; i < simplex.vertexes.length; i++) {
                    simplex.vertexes[i].setElevation(results[i].elevation);
                }
                if (results.length > simplex.vertexes.length) {
                    simplex.reflectionPoint.setElevation(results[i++].elevation);
                    simplex.expandPoint.setElevation(results[i++].elevation);
                    simplex.insideContractPoint.setElevation(results[i++].elevation);
                    simplex.outsideContractPoint.setElevation(results[i++].elevation);
                    for (var j = 0; j < simplex.shrinkPoints.length; j++) {
                        simplex.shrinkPoints[j].setElevation(results[j + i].elevation);
                    }
                }
            } else {
                console.log("Elevation service failed due to: " + status);
                console.log(simplex);
            }
            deferred.resolve();
        });

        locations = null;
        elevator = null;
        positionalRequest = null;

        return deferred.promise();
    }

    /**
     * 単体，最良点の軌跡の描画等を行う
     *
     * @param vertexes {Coordinate.Coordinate[]}
     */
    drawSimplex(vertexes:Coordinate.Coordinate[]) {
        // パン
        var lookAt = this.ge.createLookAt('');
        lookAt.setLatitude(vertexes[0].latitude);
        lookAt.setLongitude(vertexes[0].longitude);

        // ズーム
        var normA = Math.sqrt(Math.pow(vertexes[2].latitude - vertexes[0].latitude, 2) +
            Math.pow(vertexes[2].longitude - vertexes[0].longitude, 2));
        var normB = Math.sqrt(Math.pow(vertexes[1].latitude - vertexes[0].latitude, 2) +
            Math.pow(vertexes[1].longitude - vertexes[0].longitude, 2));
        var showRange = Math.max(normA, normB) * 800000;
        showRange = Math.min(showRange, this.RANGE_MAX);

        lookAt.setRange(showRange);
        this.ge.getView().setAbstractView(lookAt);

        // 三角形の描画
        var polygonPlacemark = this.ge.createPlacemark('');
        var polygon = this.ge.createPolygon('');
        polygonPlacemark.setGeometry(polygon);
        polygon.setAltitudeMode(this.ge.ALTITUDE_CLAMP_TO_SEA_FLOOR);

        var outer = this.ge.createLinearRing('');
        for (var i = 0; i < vertexes.length; i++) {
            outer.getCoordinates().pushLatLngAlt(vertexes[i].latitude, vertexes[i].longitude, 0);
        }
        polygon.setOuterBoundary(outer);

        polygonPlacemark.setStyleSelector(this.ge.createStyle(''));
        var lineStyle = polygonPlacemark.getStyleSelector().getLineStyle();
        lineStyle.setWidth(3);
        lineStyle.getColor().set('ff88ffff');
        var polyStyle = polygonPlacemark.getStyleSelector().getPolyStyle();
        polyStyle.getColor().set('1088ffff');
        this.ge.getFeatures().appendChild(polygonPlacemark);

        // TODO
        /*
         // 最良点が更新されたら lastVertex0 に追加
         if (nLastVertex0 == -1 || lastVertex0[nLastVertex0][0] != vertex[0][0] && lastVertex0[nLastVertex0][1] != vertex[1][0]) {
         nLastVertex0++;
         lastVertex0[nLastVertex0][0] = vertex[0][0];
         lastVertex0[nLastVertex0][1] = vertex[1][0];
         console.log(
         "Insert lastVertex." + nLastVertex0 + ": " + lastVertex0[nLastVertex0][0]
         + ", " + lastVertex0[nLastVertex0][1]
         );
         }

         // 問答無用に毎回描画
         if (nLastVertex0 > 0) {
         var polygonPlacemarkPath = this.ge.createPlacemark('');
         var polygonPath = this.ge.createPolygon('');
         polygonPlacemarkPath.setGeometry(polygonPath);
         polygonPath.setAltitudeMode(this.ge.ALTITUDE_CLAMP_TO_SEA_FLOOR);

         var outerPath = this.ge.createLinearRing('');
         var i = 0;
         while (i < nLastVertex0 + 1) {
         outerPath.getCoordinates().pushLatLngAlt(lastVertex0[i][0], lastVertex0[i][1], 0);
         i++;
         }
         i -= 2;
         while (i > 0) {
         outerPath.getCoordinates().pushLatLngAlt(lastVertex0[i][0], lastVertex0[i][1], 0);
         i--;
         }
         polygonPath.setOuterBoundary(outerPath);

         polygonPlacemarkPath.setStyleSelector(this.ge.createStyle(''));
         var lineStylePath = polygonPlacemarkPath.getStyleSelector().getLineStyle();
         lineStylePath.setWidth(8);
         lineStylePath.getColor().set('ff4040ff');
         this.ge.getFeatures().appendChild(polygonPlacemarkPath);
         }*/
    }
}
