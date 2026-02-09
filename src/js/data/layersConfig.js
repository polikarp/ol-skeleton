// export default {
//     groups: [
//         {
//             id: 2,
//             key: "overlays",
//             title: "Overlays",
//             order_idx: 1,
//             parent_id: null,
//             collapsed_default: true,
//             service_id: 2,
//             icon: null
//         },
//         {
//             id: 3,
//             key: "inspire",
//             title: "INSPIRE layers",
//             order_idx: 10,
//             parent_id: null,
//             collapsed_default: true,
//             service_id: 1,
//             icon: null
//         }
//     ],
//     services: [
//         {
//             id: 1,
//             name: "Geoportal Gibraltar - INSPIRE",
//             type: "WMS",
//             base_url: "https://download.geoportal.gov.gi/geoserver/inspire/ows",
//             version: "1.3.0",
//             options: []
//         },
//         {
//             id: 2,
//             name: "Geoportal Gibraltar - Public WMS",
//             type: "WMS",
//             base_url: "https://download.geoportal.gov.gi/geoserver/wms",
//             version: "1.3.0",
//             options: []
//         }
//     ]
// };

export default {
    "groups": [
        {
            "id": 2,
            "key": "overlays",
            "title": "Overlays",
            "order_idx": 1,
            "parent_id": null,
            "collapsed_default": true,
            "icon": null
        },
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
        {
            "id": 2,
            "group_id": 2,
            "name": "Geoportal Gibraltar - Public WMS",
            "type": "WMS",
            "base_url": "https://download.geoportal.gov.gi/geoserver/wms",
            "version": "1.3.0",
            "options": []
        }
    ]
};
