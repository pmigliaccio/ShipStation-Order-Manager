angular.module('orders', ['resources.orders'])
    .constant('cfg', {
            nestedItemSKUPrefix: "",
            specialCase: "", //adds items from nested options
            removeParent: true, //removes parent item from list if nested item found

            specialItemSKUPrefix: "", //if item name matches this
            specialItemNewSKUPrefix: "", //replaces it with this
            specialItemNewWeight: "", //replace it with this
            specialItemNewWeightUnits: "lbs", //and unit with these

            ignoredItemsSKUPrefix: "", //does not total items that match this sku

            defaultProductWeight: "12", //sets a default weight for new nested products added
            defaultProductUnits: "ounces",//sets a default unit value for new nested products added
            displayWeightAs: "lbs", //converts totals to this unit of measurement

            productKey: {

            }
        })

    .controller('OrdersCtrl', 
        ['$scope', 'orders', 'usSpinnerService', 
            function ($scope, orders, usSpinnerService) {
                var oc = this;
                
                var init = function(){
                    orders.getStatuses().$promise
                        .then(function(response){
                            oc.statuses = response;
                            oc.status = oc.statuses[2]; //default status: Awaiting Shipment
                            oc.getOrders(oc.status);
                        });
                };
        
                oc.getOrders = function(status){
                    usSpinnerService.spin('spinner');
        
                    orders.get({ orderStatus: status.value },
                        function (response) {
                            oc.orders = $.map(response.orders, function (value) {
                                return [value];
                            });
        
                            usSpinnerService.stop('spinner');
                        });
                };
        
                oc.statusChange = function(){
                    oc.getOrders(oc.status);
                };
        
                init();
        
                //TODO add export function that simplifies oc.orders array
            }])

    .controller('TotalsCtrl', 
        ['$scope', 'orders', 'cfg', 'usSpinnerService',
            function ($scope, orders, cfg, usSpinnerService) {
                var tc = this;
        
                var init = function () {
                    usSpinnerService.spin('spinner');
        
                    orders.get({ orderStatus: 'awaiting_shipment', pageSize: 500 },
                        function(response){
                            tc.totals = tc.Process(response.orders);
                            usSpinnerService.stop('spinner');
                        });
        
                };
        
                //totals item weight values that have the same sku
                tc.Process = function (orders) {
                    var totals = {};

                    var itemKey = cfg.productKey; //product sku prefixes with corresponding items
                    var specialCase = cfg.specialCase; //adds items from nested options
                    var removeParent = cfg.removeParent; //removes parent item from list if nested item found
                    var productWeight = cfg.defaultProductWeight; //sets a default weight for new nested products added
                    var productUnits = cfg.defaultProductUnits; //sets a default unit value for new nested products added
                    var weightFilter = cfg.displayWeightAs; //converts totals to this unit of measurement

                    for (var x in orders) {
        
                        var items = [];
                        var itemLength = 0;
                        if (orders.hasOwnProperty(x)) {
                            items = orders[x].items;
                            itemLength = items.length;
                        }

                        for (var i = 0; i < itemLength; i++) {
                            var nestedItem = false;

                            var sku = items[i].sku;
                            //split sku by categorized delimiter
                            var product = sku.split('-');

                            //loop through options attributes of products for nested products
                            if (product[0] == cfg.nestedItemSKUPrefix){
                                for(var o in items[i].options){

                                    var itemOption;
                                    if (items[i].options.hasOwnProperty(o)) {
                                       itemOption = items[i].options[o];
                                    }

                                    var regex = new RegExp( specialCase, 'gi' ); //case insensitive
                                    if (itemOption && itemOption.name.match(regex)){

                                        var itemCode = Object.keys(itemKey).filter(function(key) {return itemKey[key] === itemOption.value})[0];

                                        items.push({
                                            name: itemOption.value,
                                            sku: itemCode,
                                            weight: {
                                                value: productWeight,
                                                units: productUnits
                                            },
                                            options: []
                                        });

                                        itemLength++;

                                        nestedItem = removeParent && true;
                                    }
                                }
                                //skip if ignored item sku or nested item
                            } else if (product[0] != cfg.ignoredItemsSKUPrefix && !nestedItem){

                                if (product[0] == cfg.specialItemSKUPrefix) {
                                    product[0] = cfg.specialItemNewSKUPrefix;

                                    items[i].weight.value = cfg.specialItemNewWeight;
                                    items[i].weight.units = cfg.specialItemNewWeightUnits;
                                }

                                //if not already in final array add it
                                if (!totals[product[0]]) {
                                    var itemName = itemKey[product[0]] || product[0];

                                    totals[product[0]] = {
                                        item_name: itemName,
                                        item_sku: product[0],
                                        twelve_ounce_count: 0,
                                        five_pound_count: 0,
                                        twelve_sub_count: 0,
                                        five_sub_count: 0,
                                        total_weight: 0,
                                        item_weight_units: weightFilter
                                    };
                                }

                                //sum different product types
/*                                if (itemSKU.indexOf('Subscription') > -1 || itemSKU.indexOf('Sub') > -1) {
                                    if (itemSKU.indexOf('5lb') > -1 || itemSKU.indexOf('5 lb') > -1) {
                                        v[itemName].five_sub_count++;
                                    } else {
                                        v[itemName].twelve_sub_count++;
                                    }
                                } else {
                                    if (itemSKU.indexOf('5lb') > -1 || itemSKU.indexOf('5 lb') > -1) {
                                        v[itemName].five_pound_count++;
                                    } else {
                                        v[itemName].twelve_ounce_count++;
                                    }
                                }*/

                                //set weight from attribute if it exists
                                for(var opt in items[i].options){
                                    if (items[i].options[opt].name.toLowerCase() == "weight") {
                                        var w = items[i].options[opt].value.split(' ');
                                        items[i].weight.value = w[0];
                                        items[i].weight.units = w[1];
                                    }
                                }

                                //convert ounces to pounds if filter is set to lbs
                                if ((items[i].weight.units == "ounces" || items[i].weight.units == "oz") && weightFilter == "lbs") {
                                    items[i].weight.value = Number(items[i].weight.value) / 16;
                                }

                                //adds weight to total
                                totals[product[0]].total_weight += Number(items[i].weight.value);
                            }
                        }
        
                    }

                    //sort object and put in array
                    var outTotals = [];
                    for (var item in itemKey){
                        for(var obj in totals){
                            if (obj.toUpperCase().indexOf(item) > -1){
                                outTotals.push(totals[obj]);
                            }
                        }
                    }

                    //TODO catch values not in sort key
                    //TODO move sorting to a filter

                    return outTotals;
                };
        
                init();
        
                //TODO add export function that simplifies and sorts the tc.totals array
            }]);
