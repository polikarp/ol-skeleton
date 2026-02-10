

export default {
    "groups": [

        {
            "id": 1,
            "key": "overlays_custom",
            "title": "Overlays_custom",
            "order_idx": 1,
            "parent_id": null,
            "collapsed_default": true,
            "icon": null
        },
        // {
        //     "id": 2,
        //     "key": "overlays",
        //     "title": "Overlays",
        //     "order_idx": 1,
        //     "parent_id": null,
        //     "collapsed_default": true,
        //     "icon": null
        // },
        {
            "id": 3,
            "key": "inspire",
            "title": "INSPIRE layers",
            "order_idx": 10,
            "parent_id": null,
            "collapsed_default": true,
            "icon": null
        }
    ],
    "services": [
        {
            "id": 1,
            "group_id": 3,
            "name": "Geoportal Gibraltar - INSPIRE",
            "type": "WMS",
            "base_url": "https://download.geoportal.gov.gi/geoserver/inspire/ows",
            "version": "1.3.0",
            "options": []
        },
        // {
        //     "id": 2,
        //     "group_id": 2,
        //     "name": "Geoportal Gibraltar - Public WMS",
        //     "type": "WMS",
        //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
        //     "version": "1.3.0",
        //     "options": []
        // }
    ],

    "layers": [
            // {
            //     "id": 14,
            //     "group_id": 1,
            //     "title": "Addresses",
            //     "layer_name": "inspire:AD_Address",
            //     "description": "Addresses",
            //     "base_url": "http://download.geoportal.gov.gi/geoserver/ows",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 15,
            //     "group_id": 1,
            //     "title": "Addresses (old)",
            //     "layer_name": "inspire:AD_Address_old",
            //     "description": "Addresses (old)",
            //     "base_url": "http://download.geoportal.gov.gi/geoserver/ows",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 16,
            //     "group_id": 1,
            //     "title": "Administrative Unit",
            //     "layer_name": "inspire:AU_AdministrativeUnit",
            //     "description": "Administrative Unit",
            //     "base_url": "http://download.geoportal.gov.gi/geoserver/ows",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 17,
            //     "group_id": 1,
            //     "title": "Building",
            //     "layer_name": "inspire:BU_Building",
            //     "description": "Building",
            //     "base_url": "http://download.geoportal.gov.gi/geoserver/ows",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 18,
            //     "group_id": 1,
            //     "title": "Building Part",
            //     "layer_name": "inspire:BU_BuildingPart",
            //     "description": "Building Part",
            //     "base_url": "http://download.geoportal.gov.gi/geoserver/ows",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 19,
            //     "group_id": 1,
            //     "title": "Cadastral Parcel",
            //     "layer_name": "inspire:CP_CadastralParcel",
            //     "description": "Cadastral Parcel",
            //     "base_url": "http://download.geoportal.gov.gi/geoserver/ows",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 20,
            //     "group_id": 1,
            //     "title": "Transport Network",
            //     "layer_name": "inspire:TN_TransportNetwork",
            //     "description": "Transport Network",
            //     "base_url": "http://download.geoportal.gov.gi/geoserver/ows",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 21,
            //     "group_id": 1,
            //     "title": "Aerial 2013 v3",
            //     "layer_name": "gibgis:aerial2013_v3",
            //     "description": "Aerial 2013 v3",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 22,
            //     "group_id": 1,
            //     "title": "Basemap Basic 1",
            //     "layer_name": "gibgis:basemap_basic_1",
            //     "description": "Basemap Basic 1",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 23,
            //     "group_id": 1,
            //     "title": "Basemap Basic 1r",
            //     "layer_name": "gibgis:basemap_basic_1r",
            //     "description": "Basemap Basic 1r",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 24,
            //     "group_id": 1,
            //     "title": "Basemap Basic 2",
            //     "layer_name": "gibgis:basemap_basic_2",
            //     "description": "Basemap Basic 2",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 25,
            //     "group_id": 1,
            //     "title": "Basemap for Tourism",
            //     "layer_name": "gibgis:basemap_for_tourism",
            //     "description": "Basemap for Tourism",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 26,
            //     "group_id": 1,
            //     "title": "Basemap hybrid 2013 v3",
            //     "layer_name": "gibgis:basemap_hybrid_2013_v3",
            //     "description": "Basemap hybrid 2013 v3",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 27,
            //     "group_id": 1,
            //     "title": "Addresses",
            //     "layer_name": "inspire:AD_Address",
            //     "description": "Addresses",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 28,
            //     "group_id": 1,
            //     "title": "Addresses",
            //     "layer_name": "inspire:AD_Address_old",
            //     "description": "Addresses",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 29,
            //     "group_id": 1,
            //     "title": "Administrative unit",
            //     "layer_name": "inspire:AU_AdministrativeUnit",
            //     "description": "Administrative unit",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 30,
            //     "group_id": 1,
            //     "title": "BR_Natura2000andEmeraldBio-geographicalRegions",
            //     "layer_name": "inspire:BR_Natura2000andEmeraldBio-geographicalRegions",
            //     "description": "BR_Natura2000andEmeraldBio-geographicalRegions",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            {
                "id": 31,
                "group_id": 1,
                "title": "BU_buildingparts_vw",
                "layer_name": "inspire:BU_buildingparts",
                "description": "BU_buildingparts_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 32,
                "group_id": 1,
                "title": "Cadastral Parcel",
                "layer_name": "inspire:CP_CadastralParcel",
                "description": "Cadastral Parcel",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 33,
                "group_id": 1,
                "title": "CP_cadastralparcel_r2_vw",
                "layer_name": "inspire:CP_cadastralparcel_r2_vw",
                "description": "CP_cadastralparcel_r2_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 34,
                "group_id": 1,
                "title": "EF_EnvironmentalMonitoringFacilities",
                "layer_name": "inspire:EF_EnvironmentalMonitoringFacilities",
                "description": "EF_EnvironmentalMonitoringFacilities",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 35,
                "group_id": 1,
                "title": "EL_contourline_vw",
                "layer_name": "inspire:EL_Contourline",
                "description": "EL_contourline_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 36,
                "group_id": 1,
                "title": "Geologic Units",
                "layer_name": "inspire:GE_GeologicUnit",
                "description": "Geologic Units",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 37,
                "group_id": 1,
                "title": "Geographical Names",
                "layer_name": "inspire:GN_GeographicalNames",
                "description": "Geographical Names",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 38,
                "group_id": 1,
                "title": "HB_habitat",
                "layer_name": "inspire:HB_habitat",
                "description": "HB_habitat",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 39,
                "group_id": 1,
                "title": "HY_Reporting_WFDCoastalwater",
                "layer_name": "inspire:HY_Reporting_WFDCoastalwater",
                "description": "HY_Reporting_WFDCoastalwater",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 40,
                "group_id": 1,
                "title": "WFD-Ground Water Body",
                "layer_name": "inspire:HY_Reporting_WFDGroundWaterBody",
                "description": "WFD-Ground Water Body",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 41,
                "group_id": 1,
                "title": "LandCoverSurfaces",
                "layer_name": "inspire:LC_LandCoverSurfaces",
                "description": "LandCoverSurfaces",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 42,
                "group_id": 1,
                "title": "PD_populationdistribution",
                "layer_name": "inspire:PD_populationdistribution",
                "description": "PD_populationdistribution",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 43,
                "group_id": 1,
                "title": "PF_productionsite",
                "layer_name": "inspire:PF_productionsite",
                "description": "PF_productionsite",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 44,
                "group_id": 1,
                "title": "Protected Site",
                "layer_name": "inspire:PS_ProtectedSite",
                "description": "Protected Site",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 45,
                "group_id": 1,
                "title": "SO_SoilObservedProfile",
                "layer_name": "inspire:SO_SoilObservedProfile",
                "description": "SO_SoilObservedProfile",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 46,
                "group_id": 1,
                "title": "SU_vectorstatisticalunits",
                "layer_name": "inspire:SU_vectorstatisticalunits",
                "description": "SU_vectorstatisticalunits",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 47,
                "group_id": 1,
                "title": "TN_RoadTransportNetwork_RoadArea",
                "layer_name": "inspire:TN_RoadTransportNetwork_RoadArea",
                "description": "TN_RoadTransportNetwork_RoadArea",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 48,
                "group_id": 1,
                "title": "RoadLink default Style",
                "layer_name": "inspire:TN_RoadTransportNetwork_RoadLink",
                "description": "RoadLink default Style",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 49,
                "group_id": 1,
                "title": "admin_py",
                "layer_name": "gibgis:admin_py",
                "description": "admin_py",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            // {
            //     "id": 50,
            //     "group_id": 1,
            //     "title": "Aerial_2003",
            //     "layer_name": "gibgis:aerial2003",
            //     "description": "Aerial_2003",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 51,
            //     "group_id": 1,
            //     "title": "aerial_2013_v11_p1",
            //     "layer_name": "gibgis:aerial_2013_v11_p1",
            //     "description": "aerial_2013_v11_p1",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 52,
            //     "group_id": 1,
            //     "title": "aerial_2013_v11_p2",
            //     "layer_name": "gibgis:aerial_2013_v11_p2",
            //     "description": "aerial_2013_v11_p2",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 53,
            //     "group_id": 1,
            //     "title": "all_places_search_vw",
            //     "layer_name": "gibgis:all_places_search_vw",
            //     "description": "all_places_search_vw",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 54,
            //     "group_id": 1,
            //     "title": "app_plus_bounds_vw_add_gv",
            //     "layer_name": "tpbc:app_plus_bounds_vw_add_gv",
            //     "description": "app_plus_bounds_vw_add_gv",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 55,
            //     "group_id": 1,
            //     "title": "app_plus_bounds_vw_add_pr",
            //     "layer_name": "tpbc:app_plus_bounds_vw_add_ng",
            //     "description": "app_plus_bounds_vw_add_pr",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 56,
            //     "group_id": 1,
            //     "title": "app_plus_bounds_vw_dem_gv",
            //     "layer_name": "tpbc:app_plus_bounds_vw_dem_gv",
            //     "description": "app_plus_bounds_vw_dem_gv",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 57,
            //     "group_id": 1,
            //     "title": "app_plus_bounds_vw_dem_pr",
            //     "layer_name": "tpbc:app_plus_bounds_vw_dem_ng",
            //     "description": "app_plus_bounds_vw_dem_pr",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 58,
            //     "group_id": 1,
            //     "title": "app_plus_bounds_vw_for_viewer_search",
            //     "layer_name": "tpbc:app_plus_bounds_vw_for_viewer_search",
            //     "description": "app_plus_bounds_vw_for_viewer_search",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 59,
            //     "group_id": 1,
            //     "title": "app_plus_bounds_vw_plb_gv",
            //     "layer_name": "tpbc:app_plus_bounds_vw_plb_gv",
            //     "description": "app_plus_bounds_vw_plb_gv",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 60,
            //     "group_id": 1,
            //     "title": "app_plus_bounds_vw_plb_pr",
            //     "layer_name": "tpbc:app_plus_bounds_vw_plb_ng",
            //     "description": "app_plus_bounds_vw_plb_pr",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 61,
            //     "group_id": 1,
            //     "title": "app_plus_bounds_vw_trp_gv",
            //     "layer_name": "tpbc:app_plus_bounds_vw_trp_gv",
            //     "description": "app_plus_bounds_vw_trp_gv",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 62,
            //     "group_id": 1,
            //     "title": "app_plus_bounds_vw_trp_pr",
            //     "layer_name": "tpbc:app_plus_bounds_vw_trp_ng",
            //     "description": "app_plus_bounds_vw_trp_pr",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            {
                "id": 63,
                "group_id": 1,
                "title": "blocks_py_ind",
                "layer_name": "gibgis:blocks_py_ind",
                "description": "blocks_py_ind",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 64,
                "group_id": 1,
                "title": "blocks_py_vw",
                "layer_name": "gibgis:blocks_py_vw",
                "description": "blocks_py_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 65,
                "group_id": 1,
                "title": "buildings_py",
                "layer_name": "gibgis:buildings_py",
                "description": "buildings_py",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 66,
                "group_id": 1,
                "title": "coastal_water_bodies_25830",
                "layer_name": "gibgis:coastal_water_bodies_25830",
                "description": "coastal_water_bodies_25830",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 67,
                "group_id": 1,
                "title": "dmy_pt",
                "layer_name": "gibgis:dmy_pt",
                "description": "dmy_pt",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 68,
                "group_id": 1,
                "title": "estates_py_r2",
                "layer_name": "gibgis:estates_py_ind",
                "description": "estates_py_r2",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 69,
                "group_id": 1,
                "title": "estates_py_r2",
                "layer_name": "gibgis:estates_py_r2",
                "description": "estates_py_r2",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 70,
                "group_id": 1,
                "title": "groundwater_water_bodies_25830",
                "layer_name": "gibgis:groundwater_water_bodies_25830",
                "description": "groundwater_water_bodies_25830",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 71,
                "group_id": 1,
                "title": "hypsography_pl",
                "layer_name": "gibgis:hypsography_pl",
                "description": "hypsography_pl",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 72,
                "group_id": 1,
                "title": "landformmanmade_py",
                "layer_name": "gibgis:landformmanmade_py",
                "description": "landformmanmade_py",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 73,
                "group_id": 1,
                "title": "landformnatural_py",
                "layer_name": "gibgis:landformnatural_py",
                "description": "landformnatural_py",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 74,
                "group_id": 1,
                "title": "marine_sac_25830",
                "layer_name": "gibgis:marine_sac_25830",
                "description": "marine_sac_25830",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 75,
                "group_id": 1,
                "title": "maxbounds_py",
                "layer_name": "gibgis:maxbounds_py",
                "description": "maxbounds_py",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            // {
            //     "id": 76,
            //     "group_id": 1,
            //     "title": "nature_reserve_area_25830",
            //     "layer_name": "gibgis:nature_reserve_area_25830",
            //     "description": "nature_reserve_area_25830",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 77,
            //     "group_id": 1,
            //     "title": "nature_reserve_trail_history_buff_vw",
            //     "layer_name": "gibgis:nature_reserve_trail_history_buff_vw",
            //     "description": "nature_reserve_trail_history_buff_vw",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 78,
            //     "group_id": 1,
            //     "title": "nature_reserve_trail_monkey_trail_vw",
            //     "layer_name": "gibgis:nature_reserve_trail_monkey_trail_vw",
            //     "description": "nature_reserve_trail_monkey_trail_vw",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 79,
            //     "group_id": 1,
            //     "title": "nature_reserve_trail_nature_lover_vw",
            //     "layer_name": "gibgis:nature_reserve_trail_nature_lover_vw",
            //     "description": "nature_reserve_trail_nature_lover_vw",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 80,
            //     "group_id": 1,
            //     "title": "nature_reserve_trail_thrill_seeker_vw",
            //     "layer_name": "gibgis:nature_reserve_trail_thrill_seeker_vw",
            //     "description": "nature_reserve_trail_thrill_seeker_vw",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            // {
            //     "id": 81,
            //     "group_id": 1,
            //     "title": "ne_10m_admin_1_states_provinces_rbd",
            //     "layer_name": "gibgis:ne_10m_admin_1_states_provinces_rbd",
            //     "description": "ne_10m_admin_1_states_provinces_rbd",
            //     "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            //     "type": "wms",
            //     "geom_field": "geom",
            //     "visible_default": false,
            //     "z_index": 0,
            //     "queryable": true,
            //     "options": {
            //         "tiled": true,
            //         "format": "image/png",
            //         "version": "1.3.0"
            //     }
            // },
            {
                "id": 82,
                "group_id": 1,
                "title": "parking_bays",
                "layer_name": "gibgis:parking_bays",
                "description": "parking_bays",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 83,
                "group_id": 1,
                "title": "polling_stations_2019_pt_vw",
                "layer_name": "gibgis:polling_stations_2019_pt_vw",
                "description": "polling_stations_2019_pt_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 84,
                "group_id": 1,
                "title": "polling_stations_2019_py_vw",
                "layer_name": "gibgis:polling_stations_2019_py_vw",
                "description": "polling_stations_2019_py_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 85,
                "group_id": 1,
                "title": "polling_stations_2020_pt_vw",
                "layer_name": "gibgis:polling_stations_2020_pt_vw",
                "description": "polling_stations_2020_pt_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 86,
                "group_id": 1,
                "title": "polling_stations_2020_py_vw",
                "layer_name": "gibgis:polling_stations_2020_py_vw",
                "description": "polling_stations_2020_py_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 87,
                "group_id": 1,
                "title": "polling_stations_2023_pt_vw",
                "layer_name": "gibgis:polling_stations_2023_pt_vw",
                "description": "polling_stations_2023_pt_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 88,
                "group_id": 1,
                "title": "polling_stations_2023_py_vw",
                "layer_name": "gibgis:polling_stations_2023_py_vw",
                "description": "polling_stations_2023_py_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 89,
                "group_id": 1,
                "title": "polling_stations_2023_py_vw_test",
                "layer_name": "gibgis:polling_stations_2023_py_vw_test",
                "description": "polling_stations_2023_py_vw_test",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 90,
                "group_id": 1,
                "title": "profile_along_line_step",
                "layer_name": "inspire:profile_along_line_step",
                "description": "profile_along_line_step",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 91,
                "group_id": 1,
                "title": "public_toilets_vw",
                "layer_name": "gibgis:public_toilets_vw",
                "description": "public_toilets_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 92,
                "group_id": 1,
                "title": "rbd_etrs_25830",
                "layer_name": "gibgis:rbd_etrs_25830",
                "description": "rbd_etrs_25830",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 93,
                "group_id": 1,
                "title": "recycling_bins_vw",
                "layer_name": "gibgis:recycling_bins_vw",
                "description": "recycling_bins_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 94,
                "group_id": 1,
                "title": "reefareas_shallow_25830",
                "layer_name": "gibgis:reefareas_shallow_25830",
                "description": "reefareas_shallow_25830",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 95,
                "group_id": 1,
                "title": "reefcontareas_25830",
                "layer_name": "gibgis:reefcontareas_25830",
                "description": "reefcontareas_25830",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 96,
                "group_id": 1,
                "title": "refuse_bins_vw",
                "layer_name": "gibgis:refuse_bins_vw",
                "description": "refuse_bins_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 97,
                "group_id": 1,
                "title": "roads_lb_r2",
                "layer_name": "gibgis:roads_lb_r2",
                "description": "roads_lb_r2",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 98,
                "group_id": 1,
                "title": "roads_lb_vw",
                "layer_name": "gibgis:roads_lb_vw",
                "description": "roads_lb_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 99,
                "group_id": 1,
                "title": "structures_py_vw",
                "layer_name": "gibgis:structures_py",
                "description": "structures_py_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 100,
                "group_id": 1,
                "title": "terrestrial_sac_area_25830",
                "layer_name": "gibgis:terrestrial_sac_area_25830",
                "description": "terrestrial_sac_area_25830",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 101,
                "group_id": 1,
                "title": "territorial_sea_limit_25830_py",
                "layer_name": "gibgis:territorial_sea_limit_25830_py",
                "description": "territorial_sea_limit_25830_py",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 102,
                "group_id": 1,
                "title": "thoroughfare_pl",
                "layer_name": "gibgis:thoroughfare_pl",
                "description": "thoroughfare_pl",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 103,
                "group_id": 1,
                "title": "topolabels_extended",
                "layer_name": "gibgis:topolabels_extended",
                "description": "topolabels_extended",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 104,
                "group_id": 1,
                "title": "topolabels_pt",
                "layer_name": "gibgis:topolabels_pt",
                "description": "topolabels_pt",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 105,
                "group_id": 1,
                "title": "topolabels_pt_ext_vw",
                "layer_name": "gibgis:topolabels_pt_ext_vw",
                "description": "topolabels_pt_ext_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 106,
                "group_id": 1,
                "title": "topolabels_pt_gtb_vw",
                "layer_name": "gibgis:topolabels_pt_gtb_vw",
                "description": "topolabels_pt_gtb_vw",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 107,
                "group_id": 1,
                "title": "tpo_individual",
                "layer_name": "tpbc:tpo_individual",
                "description": "tpo_individual",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 108,
                "group_id": 1,
                "title": "transport_py",
                "layer_name": "gibgis:transport_py",
                "description": "transport_py",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 109,
                "group_id": 1,
                "title": "tree_area_including_centroids",
                "layer_name": "tpbc:tree_area_including_centroids",
                "description": "tree_area_including_centroids",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 110,
                "group_id": 1,
                "title": "under_construction",
                "layer_name": "gibgis:under_construction",
                "description": "under_construction",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 111,
                "group_id": 1,
                "title": "unitaddress_for_geoportal",
                "layer_name": "inspire:unitaddress_for_geoportal",
                "description": "unitaddress_for_geoportal",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 112,
                "group_id": 1,
                "title": "vegetation_py",
                "layer_name": "gibgis:vegetation_py",
                "description": "vegetation_py",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            },
            {
                "id": 113,
                "group_id": 1,
                "title": "view_all_app_data",
                "layer_name": "tpbc:view_all_app_data",
                "description": "view_all_app_data",
                "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
                "type": "wms",
                "geom_field": "geom",
                "visible_default": false,
                "z_index": 0,
                "queryable": true,
                "options": {
                    "tiled": true,
                    "format": "image/png",
                    "version": "1.3.0"
                }
            }

    ]
};
