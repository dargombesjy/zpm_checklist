sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/models"
],
    function (Controller, models) {
        "use strict";

        return Controller.extend("zpmchecklist.controller.Main", {
            onInit: function () {
                const oViewParam = {
                    createMode: false,
                    displayMode: true,
                    changeMode: false,
                    aufnr: "",
                    chkno: ""
                }
                const oDisplayModel = models.createJSONModel(oViewParam);
                this.getView().setModel(oDisplayModel, "displayModel");
            },

            onCreate: function () {
                // var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                const sParam = this._getRouteProperty("aufnr");
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("create", {
                    aufnr: sParam
                });
            },

            onDisplay: function () {
                const sParam = this._getRouteProperty("aufnr");
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("detail", {
                    aufnr: sParam
                });
            },

            onChange: function () {
                const sParam = this._getRouteProperty("aufnr");
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("detail", {
                    aufnr: sParam
                });
            },

            onSelectionChange: function (oEvent) {
                const oSelectedItem = oEvent.getParameter("listItem");
                if (oSelectedItem) {
                    const oModel = this.getView().getModel("displayModel");
                    let oBindingContext = oSelectedItem.getBindingContext("pmOrderService");
                    let oOrder = oBindingContext.getObject();
                    oModel.setProperty("/aufnr", oOrder.aufnr);
                    oModel.setProperty("/chkno", oOrder.chkno);
                    if (!oOrder.chkno) {
                        oModel.setProperty("/createMode", true);
                        oModel.setProperty("/changeMode", false);
                        oModel.setProperty("/displayMode", false);
                    } else {
                        oModel.setProperty("/createMode", false);
                        if (oOrder.stat = 'I0002') {
                            oModel.setProperty("/changeMode", true);
                            oModel.setProperty("/displayMode", false);
                        } else {
                            oModel.setProperty("/changeMode", false);
                            oModel.setProperty("/displayMode", true);
                        }
                    }
                }
            },

            _getRouteProperty: function (sProp) {
                const oModel = this.getView().getModel("displayModel");
                const sPath = "/" + sProp;
                const sParam = oModel.getProperty(sPath);
                return sParam;
            },

            _buildHeader: function (oData, oHeaderContainer) {
                const oChecklistModel = this.getView().getModel("oChecklistModel").getData();
                const oHeader = new sap.m.VBox({
                    width: "90%",
                    items: [
                        new sap.m.VBox({
                            items: [
                                new sap.m.HBox({
                                    width: "50%",
                                    items: [
                                        new sap.m.Text({
                                            text: "Order",
                                            layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                        }),
                                        new sap.m.Text({
                                            text: "{oChecklistHeaderModel>/aufnr} {oChecklistHeaderModel>/ktext}",
                                            layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                        })
                                    ]
                                }),
                                new sap.m.HBox({
                                    width: "50%",
                                    items: [
                                        new sap.m.Text({
                                            text: "Functional Location", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                        }),
                                        new sap.m.Text({
                                            text: "{oChecklistHeaderModel>/Tplma} {oChecklistHeaderModel>/pltxt}",
                                            layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                        })
                                    ]
                                }),
                                new sap.m.HBox({
                                    width: "50%",
                                    items: [
                                        new sap.m.Text({
                                            text: "Equipment", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                        }),
                                        new sap.m.Text({
                                            text: "{oChecklistHeaderModel>/equnr} {oChecklistHeaderModel>/eqktx}", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                        })
                                    ]
                                }),
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.HBox({
                                            width: "50%",
                                            items: [
                                                new sap.m.Text({
                                                    text: "Planner Group", layoutData:
                                                        [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                                }),
                                                new sap.m.Text({
                                                    text: "{oChecklistHeaderModel>/ingpr} {oChecklistHeaderModel>/innam}",
                                                    layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                                })]
                                        }),
                                        new sap.m.HBox({
                                            width: "50%",
                                            items: [
                                                new sap.m.Text({
                                                    text: "Actual Start",
                                                    layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 0 })]
                                                }),
                                                new sap.m.DateTimePicker("pick-gstri", {
                                                    value: {
                                                        path: "oChecklistModel>/gstri",
                                                        type: "sap.ui.model.type.DateTime"
                                                        // formatOptions: {
                                                        //     source: {
                                                        //         pattern: "yyyyMMddHHmmss"
                                                        //     },
                                                        //     style: "medium",
                                                        //     UTC: true
                                                        // }
                                                    },
                                                    // displayFormat: "medium",
                                                    change: this.onActualDateChange.bind(this),
                                                    enabled: { path: "oViewModel>/allowEdit" },
                                                    width: "100%",
                                                    layoutData: [new sap.m.FlexItemData({ baseSize: "60%", growFactor: 0 })]
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.HBox({
                                            width: "50%",
                                            items: [
                                                new sap.m.Text({
                                                    text: "Work Center",
                                                    layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                                }),
                                                new sap.m.Text({
                                                    text: "{oChecklistHeaderModel>/arbpl} {oChecklistHeaderModel>/Cktext}",
                                                    layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                                })]
                                        }),
                                        new sap.m.HBox({
                                            width: "50%",
                                            items: [
                                                new sap.m.Text({
                                                    text: "Actual Finish.",
                                                    layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 0 })]
                                                }),
                                                new sap.m.DateTimePicker("pick-gltri", {
                                                    value: {
                                                        path: "oChecklistModel>/gltri",
                                                        type: "sap.ui.model.type.DateTime",
                                                        // formatOptions: {
                                                        //     source: {
                                                        //         pattern: "yyyyMMddHHmmss"
                                                        //     },
                                                        //     style: "medium",
                                                        //     UTC: true
                                                        // }
                                                    },
                                                    // displayFormat: "short",
                                                    change: this.onActualDateChange.bind(this),
                                                    enabled: { path: "oViewModel>/allowEdit" },
                                                    width: "100%",
                                                    layoutData: [new sap.m.FlexItemData({ baseSize: "60%", growFactor: 0 })]
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                });
                // oHeader.setModel(this.getView().getModel("oChecklistHeaderModel"));
                // oHeader.bindElement({ path: "/" });

                const oLeaders = new Table02("table-leaders", {
                    title: "Inspector (Leader)",
                    showTitle: true,
                    headerToolbar: new sap.m.Toolbar({
                        content: [
                            new sap.m.Title({ text: "Inspector (Leader)" }),
                            new sap.m.ToolbarSpacer(),
                            new sap.m.Button("add-leader-btn", {
                                icon: "sap-icon://add",
                                visible: { path: "oViewModel>/allowEdit" },
                                press: this.onAddLeaderPress.bind(this)
                            })
                        ]
                    }),
                    column: [
                        new sap.m.HBox({
                            alignContent: "Center",
                            justifyContent: "SpaceAround",
                            items: [
                                new sap.m.Text({
                                    text: "Name",
                                    layoutData: [new sap.m.FlexItemData({ baseSize: "50%", growFactor: 0 })]
                                }),
                                new sap.m.Text({
                                    text: "Title",
                                    layoutData: [new sap.m.FlexItemData({ baseSize: "40%", growFactor: 0 })]
                                }),
                                new sap.m.Text({
                                    text: "",
                                    layoutData: [new sap.m.FlexItemData({ baseSize: "10%", growFactor: 0 })]
                                })
                            ]
                        })
                    ],
                    rows: {
                        path: "oChecklistModel>/to_Partner/results",
                        filters: [new sap.ui.model.Filter("loekz", sap.ui.model.FilterOperator.NE, "X")],
                        template: new sap.m.HBox({
                            alignContent: "Start",
                            justifyContent: "SpaceAround",
                            items: [
                                new sap.m.ComboBox({
                                    width: "90%",
                                    enabled: { path: "oViewModel>/allowEdit" },
                                    items: {
                                        path: "partnerVH>/ZC_PM0001_Partners_VH",
                                        template: new sap.ui.core.Item({
                                            key: "{partnerVH>bp_id}",
                                            text: "{partnerVH>bp_name}"
                                        }),
                                        templateShareable: false
                                    },
                                    selectedKey: "{oChecklistModel>bp_id}",
                                    selectionChange: this.onLeaderChange.bind(this),
                                    layoutData: [new sap.m.FlexItemData({ baseSize: "50%", growFactor: 0 })]
                                }),
                                new sap.m.Text({
                                    text: "{oChecklistModel>bp_func}", textAlign: "Center",
                                    layoutData: [new sap.m.FlexItemData({ baseSize: "40%", growFactor: 0 })]
                                }),
                                new sap.m.Button({
                                    icon: "sap-icon://delete",
                                    visible: { path: "oViewModel>/allowEdit" },
                                    press: this.onDelLeaderPress.bind(this)
                                })
                                // new sap.m.Text({
                                //     text: "",
                                //     layoutData: [new sap.m.FlexItemData({ baseSize: "10%", growFactor: 0 })]
                                // })
                            ]
                        }),
                        templateShareable: false
                    }
                });

                oHeader.addItem(oLeaders);
                oHeaderContainer.addItem(oHeader);
            },
            _buildFooter: function (oData, oFooterContainer) {
                const oCmbApp1 = new sap.m.ComboBox("approver1-cmb", {
                    width: "100%",
                    enabled: { path: "oViewModel>/allowEdit" },
                    items: {
                        path: "partnerVH>/ZC_PM0001_Partners_VH",
                        template: new sap.ui.core.Item({
                            key: "{partnerVH>bp_id}",
                            text: "{partnerVH>bp_name}"
                        }),
                        templateShareable: false,
                    },
                    selectedKey: "{oChecklistModel>/to_Approver/results/0/bp_id}",
                    selectionChange: this.onApproverChange.bind(this),
                    // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                });
                oCmbApp1.bindProperty("selectedKey", "oChecklistModel>/to_Approver/results/0/bp_id");

                const oCmbApp2 = new sap.m.ComboBox("approver2-cmb", {
                    width: "100%",
                    enabled: { path: "oViewModel>/allowEdit" },
                    items: {
                        path: "partnerVH>/ZC_PM0001_Partners_VH",
                        template: new sap.ui.core.Item({
                            key: "{partnerVH>bp_id}",
                            text: "{partnerVH>bp_name}"
                        }),
                        templateShareable: false,
                    },
                    selectedKey: "{oChecklistModel>/to_Approver/results/1/bp_id}",
                    selectionChange: this.onApproverChange.bind(this),
                    // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                });
                oCmbApp2.bindProperty("selectedKey", "oChecklistModel>/to_Approver/results/1/bp_id");

                const oCmbApp3 = new sap.m.ComboBox("approver3-cmb", {
                    width: "100%",
                    enabled: { path: "oViewModel>/allowEdit" },
                    items: {
                        path: "partnerVH>/ZC_PM0001_Partners_VH",
                        template: new sap.ui.core.Item({
                            key: "{partnerVH>bp_id}",
                            text: "{partnerVH>bp_name}"
                        }),
                        templateShareable: false,
                    },
                    selectedKey: "{oChecklistModel>/to_Approver/results/2/bp_id}",
                    selectionChange: this.onApproverChange.bind(this),
                    // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                });
                oCmbApp3.bindProperty("selectedKey", "oChecklistModel>/to_Approver/results/2/bp_id");

                const oFooter = new sap.m.VBox("footer", {
                    width: "70%",
                    items: [
                        new sap.m.HBox({
                            justifyContent: "SpaceAround",
                            items: [
                                new sap.m.Text({
                                    text: "Checked By,"
                                    // layoutData: [ new sap.m.FlexItemData({ baseSize: "90%", growFactor: 2}) ]
                                }),
                                new sap.m.Text({ text: "Validated By," }),
                                new sap.m.Text({ text: "Confirmed By," })
                            ]
                        }),
                        new sap.m.HBox({
                            height: "5em",
                            alignItems: "Center",
                            justifyContent: "SpaceAround",
                            items: [
                                new sap.m.Text({ text: "" }),
                                new sap.m.Text({ text: "" }),
                                new sap.m.Text({ text: "" })
                            ]
                        }),
                        new sap.m.HBox({
                            justifyContent: "SpaceAround",
                            items: [oCmbApp1, oCmbApp2, oCmbApp3]
                        }),
                        new sap.m.HBox({
                            justifyContent: "SpaceAround",
                            items: [
                                new sap.m.Text({ text: "" }),
                                new sap.m.Text({ text: "" }),
                                new sap.m.Text({ text: "" })
                            ]
                        })
                    ]
                })
                oFooter.addStyleClass("sapUiLargeMarginTopBottom");
                oFooterContainer.addItem(oFooter);
            },

            _buildImageBox: function (oData, oImageContainer) {
                // const oRowModelData = this._aRowModels[0];
                // const oChecklistModel = this.getView().getModel("oChecklistModel").getData();
                const oImageBox = new sap.m.VBox({
                    width: "80%",
                    items: [
                        new sap.m.HBox("image-box", {
                            // minHe: "20em",
                            wrap: sap.m.FlexWrap.Wrap,
                            alignItems: "Center",
                            justifyContent: "SpaceAround",
                            items: [
                                new sap.m.VBox("image-box-1", {
                                    // width: "50%",
                                    items: [
                                        new sap.m.Image({ src: "{oChecklistModel>/to_Attachment/results/0/att_url}", height: "20em" }),
                                        new sap.m.HBox({
                                            items: [
                                                new sap.ui.unified.FileUploader("fileUploader1", {
                                                    width: "100%",
                                                    visible: { path: "oViewModel>/allowEdit" },
                                                    buttonOnly: true,
                                                    buttonText: "Browse",
                                                    fileType: ["jpg", "jpeg", "png"],
                                                    maximumFileSize: 5, // in MB
                                                    change: this.onFileChange.bind(this),
                                                    uploadUrl: "{oChecklistModel>/to_Attachment/results/0/att_url}",
                                                    // name: oRowModelData.aufpl + "_image1",
                                                    // uploadOnChange: true,
                                                    uploadComplete: this.handleUpload
                                                })
                                            ],
                                            layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                        })
                                    ]
                                }),
                                new sap.m.VBox("image-box-2", {
                                    // width: "50%",
                                    items: [
                                        new sap.m.Image({ src: "{oChecklistModel>/to_Attachment/results/1/att_url}", height: "20em" }),
                                        new sap.m.HBox({
                                            items: [
                                                new sap.ui.unified.FileUploader("fileUploader2", {
                                                    width: "100%",
                                                    visible: { path: "oViewModel>/allowEdit" },
                                                    buttonOnly: true,
                                                    buttonText: "Browse",
                                                    fileType: ["jpg", "jpeg", "png"],
                                                    maximumFileSize: 5, // in MB
                                                    change: this.onFileChange.bind(this),
                                                    uploadUrl: "oChecklistModel>/to_Attachment/results/1/att_url}",
                                                    // name: oRowModelData + "image2",
                                                    // uploadOnChange: true,
                                                    uploadComplete: this.handleUpload
                                                })
                                            ],
                                            layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                });
                oImageBox.addStyleClass("sapUiContentPadding");
                oImageContainer.addItem(oImageBox);
            },

            _backupBuildTable: function () {
                // const oNewRowModel = this.getView().getModel("oNewRowModel");
                // for (let taskData of oData) {
                //     // start build json model for rows
                //     const oRow = new sap.m.HBox({
                //         alignContent: "Start",
                //         justifyContent: "Start",
                //         items: []
                //     });

                //     const sRowModelName = taskData.aufpl + "_" + taskData.aplzl;
                //     const oRowModel = this.getView().getModel(sRowModelName);
                //     if (oRowModel != undefined) {
                //         oRow.setModel(oRowModel);
                //         oRow.bindElement({ path: "/" });
                //     }
                //     // let sPath = "oNewRowModel>/" + sRowModelName;
                //     // oRow.bindElement({
                //     //     path: sPath,
                //     //     // model: "oNewRowModel"
                //     // });

                //     // container for item values
                //     const oValueBox = new sap.m.HBox({
                //         layoutData: [new sap.m.FlexItemData({ baseSize: "40%", growFactor: 1, shrinkFactor: 1 })]
                //     });

                //     let oCell = {};
                //     let skipForMpoint = false;
                //     for (let colData of this._oChecklistHeader.toColumn.results) {
                //         if (colData.has_subcol == "X" || colData.is_hidden == "X") continue;
                //         let flexGrow = parseFloat(colData.col_grow === "" ? 0 : colData.col_grow);
                //         let flexShrink = parseFloat(colData.col_shrink === "" ? 0 : colData.col_shrink);
                //         let colBasis = colData.col_basis || "auto";
                //         let cellKey = colData.col_name;

                //         if (colData.col_type == "L") {
                //             oCell = new sap.m.Text({
                //                 text: taskData[colData.col_name],
                //                 layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                //             });
                //             if (taskData.steus == "INT1") {
                //                 oCell.addStyleClass("group-header");
                //             }
                //             if (taskData.ref_image) {
                //                 const oCellwithImage = new sap.m.VBox({
                //                     layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                //                 });
                //                 oCellwithImage.addItem(oCell);

                //                 const oImage = new sap.m.Image({
                //                     src: "{/ref_image}",
                //                     alt: "Reference Image",
                //                     height: "30px",
                //                     densityAware: false,
                //                     decorative: false,
                //                     // layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                //                     detailBox: new sap.m.LightBox({
                //                         imageContent: [new sap.m.LightBoxItem({
                //                             imageSrc: "{/ref_image}",
                //                             title: "Referensi gambar",
                //                             // description: "Detailed view of the image."
                //                         })]
                //                     })
                //                 });
                //                 oCellwithImage.addItem(oImage);
                //                 oRow.addItem(oCellwithImage);
                //             } else {
                //                 oRow.addItem(oCell);
                //             }
                //         } else if (colData.col_type == 'A') {
                //             if (taskData.steus == "INT") {
                //                 oCell = new sap.m.TextArea({
                //                     value: "{/values/" + cellKey + "/sval}",
                //                     placeholder: "Entry value..",
                //                     rows: 1,
                //                     width: "100%",
                //                     enabled: { path: "oViewModel>/allowEdit" },
                //                     layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                //                 });
                //             } else {
                //                 oCell = new sap.m.Text({
                //                     text: "",
                //                     layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                //                 });
                //             }
                //             oRow.addItem(oCell);
                //         } else if (colData.col_type == "V") {
                //             let aVals = taskData.column_list ? taskData.column_list.split(",").map(function (item) { return item.trim() }) : [];
                //             let sFound = aVals.includes(colData.col_name);

                //             if (taskData.ref_mpoint) {
                //                 if (!skipForMpoint) {
                //                     for (let index = 0; index < aVals.length; index++) {
                //                         const el = aVals[index];
                //                         if (el == "mpoint") {
                //                             oCell = new sap.m.Input({
                //                                 value: "{/values/" + el + "/sval}", type: "Number", required: true,
                //                                 placeholder: "Measure", enabled: { path: "oViewModel>/allowEdit" }
                //                             });
                //                         } else if (el == "lower_limit" && taskData.lower_limit.length > 0) {
                //                             oCell = new sap.m.Text({
                //                                 text: "Min: {/values/" + el + "/sval}" + taskData.atawe, textAlign: "Center",
                //                                 layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                //                             });
                //                         } else if (el == "upper_limit" && taskData.upper_limit.length > 0) {
                //                             oCell = new sap.m.Text({
                //                                 text: "Max: {/values/" + el + "/sval}" + taskData.atawe, textAlign: "Center",
                //                                 layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                //                             });
                //                         } else {
                //                             oCell = new sap.m.Text({
                //                                 text: "{/values/" + el + "/sval}", textAlign: "Center",
                //                                 layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                //                             });
                //                         }

                //                         oCell.setLayoutData(new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1 }));
                //                         oValueBox.addItem(oCell);
                //                         skipForMpoint = true;
                //                     }
                //                 }
                //             }

                //             if (!skipForMpoint) {
                //                 if (taskData.steus == "INT1") {
                //                     if (this.getView().getModel("oViewModel").getProperty("/allowEdit")) {
                //                         oCell = new sap.m.ComboBox({
                //                             width: colBasis,
                //                             enabled: { path: "oViewModel>/allowEdit" },
                //                             // selectedKey: "{/values/" + cellKey + "/sval}",
                //                             selectionChange: this._onGroupCategorySelect.bind(this),
                //                             layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })],
                //                             customData: [
                //                                 new sap.ui.core.CustomData({ key: "category", value: taskData.category }),
                //                                 new sap.ui.core.CustomData({ key: "colname", value: cellKey })
                //                             ]
                //                         });
                //                         let oItemTemplate = new sap.ui.core.Item({
                //                             key: "{oViewModel>key}",
                //                             text: "{oViewModel>text}"
                //                         })
                //                         oCell.bindAggregation("items", {
                //                             path: "oViewModel>/list",
                //                             template: oItemTemplate
                //                         });
                //                         oCell.addStyleClass("group-header");
                //                     } else {
                //                         oCell = new sap.m.Text({
                //                             text: "",
                //                             layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                //                         });
                //                     }
                //                 } else if (sFound) {
                //                     oCell = new sap.m.ComboBox({
                //                         width: colBasis,
                //                         enabled: { path: "oViewModel>/allowEdit" },
                //                         selectedKey: "{/values/" + cellKey + "/sval}",
                //                         layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                //                     });
                //                     let oItemTemplate = new sap.ui.core.Item({
                //                         key: "{oViewModel>key}",
                //                         text: "{oViewModel>text}"
                //                     })
                //                     oCell.bindAggregation("items", {
                //                         path: "oViewModel>/list",
                //                         template: oItemTemplate
                //                     });
                //                 } else {
                //                     oCell = new sap.m.Text({
                //                         text: "",
                //                         layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                //                     });
                //                 }
                //                 oValueBox.addItem(oCell);
                //             }
                //             oRow.addItem(oValueBox);
                //         }
                //     }
                //     oTable.addRow(oRow);
                // };
            }
        });
    });
