sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zpmchecklist/control/Table02",
    "zpmchecklist/model/validator"
    // "zpmchecklist/control/Column02",
    // "zpmchecklist/control/Row02",
    // "zpmchecklist/model/models"
], function (Controller, Table02, validator) {  //, Column02, Row02, models) {
    "use strict";

    return Controller.extend("zpmchecklist.controller.BaseController", {

        _buildTable: function (oData, oTableContainer) {
            const oTableWrapper = new sap.m.VBox("tableWrapper", {
                width: "90%",
                layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
            });

            let tabCounter = 0;
            tabCounter += 1;
            const oTable = new Table02({
                id: "table0" + tabCounter,
                title: this._oChecklistHeader.cvname,
                showTitle: true
            }
            );

            this._oChecklistHeader.toColumn.results.sort(function (a, b) { return a.col_pos - b.col_pos });
            const oColumn = new sap.m.HBox({
                alignContent: "Stretch",
                justifyContent: "Start",
                items: []
            });
            const oColValueBox = new sap.m.HBox("colspan-container", {
                layoutData: [new sap.m.FlexItemData({ baseSize: "40%", growFactor: 1, shrinkFactor: 1 })]
            });

            for (let colData of this._oChecklistHeader.toColumn.results) {
                if (!colData.col_type || colData.is_hidden == "X") continue;
                let flexGrow = parseFloat(colData.col_grow === "" ? 0 : colData.col_grow);
                let colBasis = colData.col_basis || "auto";

                if (colData.col_type == "V") {
                    if (colData.has_subcol == "X") {
                        this._oSubcol = new sap.m.HBox();
                        this._oSpancol = new sap.m.VBox("spancol-parent", {
                            width: "100%",
                            items: [
                                new sap.m.Text({
                                    width: "100%",
                                    text: colData.col_label,
                                    layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                }),
                                this._oSubcol
                            ],
                            // layoutData: [new sap.m.FlexItemData({ baseSize: "10%", growFactor: 1 })]
                        });
                        oColValueBox.addItem(this._oSpancol);
                    } else {
                        const colLabel = new sap.m.Text({
                            text: colData.col_label,
                            layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                        });
                        if (colData.is_subcol == 'X') {
                            this._oSubcol.addItem(colLabel);
                        } else {
                            oColValueBox.addItem(colLabel);
                        }
                    }
                    oColumn.addItem(oColValueBox);
                } else {
                    const colLabel = new sap.m.Text({
                        text: colData.col_label,
                        layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                    });
                    oColumn.addItem(colLabel);
                }
            }
            oTable.setColumn(oColumn);   // end set column

            const oNewRowModel = this.getView().getModel("oNewRowModel");
            for (let taskData of oData) {
                // start build json model for rows
                const oRow = new sap.m.HBox({
                    alignContent: "Start",
                    justifyContent: "Start",
                    items: []
                });


                const sRowModelName = taskData.aufpl + "_" + taskData.aplzl;
                const oRowModel = this.getView().getModel(sRowModelName);
                if (oRowModel != undefined) {
                    oRow.setModel(oRowModel);
                    oRow.bindElement({ path: "/" });
                }
                // let sPath = "oNewRowModel>/" + sRowModelName;
                // oRow.bindElement({
                //     path: sPath,
                //     // model: "oNewRowModel"
                // });

                // container for item values
                const oValueBox = new sap.m.HBox({
                    layoutData: [new sap.m.FlexItemData({ baseSize: "40%", growFactor: 1, shrinkFactor: 1 })]
                });

                let oCell = {};
                let skipForMpoint = false;
                for (let colData of this._oChecklistHeader.toColumn.results) {
                    if (colData.has_subcol == "X" || colData.is_hidden == "X") continue;
                    let flexGrow = parseFloat(colData.col_grow === "" ? 0 : colData.col_grow);
                    let flexShrink = parseFloat(colData.col_shrink === "" ? 0 : colData.col_shrink);
                    let colBasis = colData.col_basis || "auto";
                    let cellKey = colData.col_name;

                    if (colData.col_type == "L") {
                        oCell = new sap.m.Text({
                            text: taskData[colData.col_name],
                            layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                        });
                        if (taskData.steus == "INT1") {
                            oCell.addStyleClass("group-header");
                        }
                        if (taskData.ref_image) {
                            const oCellwithImage = new sap.m.VBox({
                                layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                            });
                            oCellwithImage.addItem(oCell);

                            const oImage = new sap.m.Image({
                                src: "{/ref_image}",
                                alt: "Reference Image",
                                height: "30px",
                                densityAware: false,
                                decorative: false,
                                // layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                detailBox: new sap.m.LightBox({
                                    imageContent: [new sap.m.LightBoxItem({
                                        imageSrc: "{/ref_image}",
                                        title: "Referensi gambar",
                                        // description: "Detailed view of the image."
                                    })]
                                })
                            });
                            oCellwithImage.addItem(oImage);
                            oRow.addItem(oCellwithImage);
                        } else {
                            oRow.addItem(oCell);
                        }
                    } else if (colData.col_type == 'A') {
                        if (taskData.steus == "INT") {
                            oCell = new sap.m.TextArea({
                                value: "{/values/" + cellKey + "/sval}",
                                placeholder: "Entry value..",
                                rows: 1,
                                width: "100%",
                                enabled: { path: "oViewModel>/allowEdit" },
                                layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                            });
                        } else {
                            oCell = new sap.m.Text({
                                text: "",
                                layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                            });
                        }
                        oRow.addItem(oCell);
                    } else if (colData.col_type == "V") {
                        let aVals = taskData.column_list ? taskData.column_list.split(",").map(function (item) { return item.trim() }) : [];
                        let sFound = aVals.includes(colData.col_name);

                        if (taskData.ref_mpoint) {
                            if (!skipForMpoint) {
                                for (let index = 0; index < aVals.length; index++) {
                                    const el = aVals[index];
                                    if (el == "mpoint") {
                                        oCell = new sap.m.Input({
                                            value: "{/values/" + el + "/sval}", type: "Number", required: true,
                                            placeholder: "Measure", enabled: { path: "oViewModel>/allowEdit" }
                                        });
                                    } else if (el == "lower_limit" && taskData.lower_limit.length > 0) {
                                        oCell = new sap.m.Text({
                                            text: "Min: {/values/" + el + "/sval}" + taskData.atawe, textAlign: "Center",
                                            layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                        });
                                    } else if (el == "upper_limit" && taskData.upper_limit.length > 0) {
                                        oCell = new sap.m.Text({
                                            text: "Max: {/values/" + el + "/sval}" + taskData.atawe, textAlign: "Center",
                                            layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                        });
                                    } else {
                                        oCell = new sap.m.Text({
                                            text: "{/values/" + el + "/sval}", textAlign: "Center",
                                            layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                        });
                                    }

                                    oCell.setLayoutData(new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1 }));
                                    oValueBox.addItem(oCell);
                                    skipForMpoint = true;
                                }
                            }
                        }

                        if (!skipForMpoint) {
                            if (taskData.steus == "INT1") {
                                if (this.getView().getModel("oViewModel").getProperty("/allowEdit")) {
                                    oCell = new sap.m.ComboBox({
                                        width: colBasis,
                                        enabled: { path: "oViewModel>/allowEdit" },
                                        // selectedKey: "{/values/" + cellKey + "/sval}",
                                        selectionChange: this._onGroupCategorySelect.bind(this),
                                        layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })],
                                        customData: [
                                            new sap.ui.core.CustomData({ key: "category", value: taskData.category }),
                                            new sap.ui.core.CustomData({ key: "colname", value: cellKey })
                                        ]
                                    });
                                    let oItemTemplate = new sap.ui.core.Item({
                                        key: "{oViewModel>key}",
                                        text: "{oViewModel>text}"
                                    })
                                    oCell.bindAggregation("items", {
                                        path: "oViewModel>/list",
                                        template: oItemTemplate
                                    });
                                    oCell.addStyleClass("group-header");
                                } else {
                                    oCell = new sap.m.Text({
                                        text: "",
                                        layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                                    });
                                }
                            } else if (sFound) {
                                oCell = new sap.m.ComboBox({
                                    width: colBasis,
                                    enabled: { path: "oViewModel>/allowEdit" },
                                    selectedKey: "{/values/" + cellKey + "/sval}",
                                    layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                                });
                                let oItemTemplate = new sap.ui.core.Item({
                                    key: "{oViewModel>key}",
                                    text: "{oViewModel>text}"
                                })
                                oCell.bindAggregation("items", {
                                    path: "oViewModel>/list",
                                    template: oItemTemplate
                                });
                            } else {
                                oCell = new sap.m.Text({
                                    text: "",
                                    layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                                });
                            }
                            oValueBox.addItem(oCell);
                        }
                        oRow.addItem(oValueBox);
                    }
                }
                oTable.addRow(oRow);
            };

            oTableWrapper.addItem(oTable);
            oTableContainer.addItem(oTableWrapper);
        },

        _aRowModels: [],
        _oChecklistHeader: {},
        _oChecklistData: {},

        onExit: function () {
            this._aRowModels = [];
            this._oChecklistHeader = {};
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
                                                change: this._onActualDateChange.bind(this),
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
                                                change: this._onActualDateChange.bind(this),
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
                                                uploadUrl: "oChecklistModel>/to_Attachment/results/0/att_url}",
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

        handleUpload: function () {
            alert("File uploaded successfully.");
        },

        onFileChange: function (oEvent) {
            const oFile = oEvent.getParameters("files").files[0];
            const sId = oEvent.getSource().getId();
            const oModel = this.getView().getModel("oChecklistModel");
            // const aAttachments = oModel.getProperty("/to_Attachment/results");
            if (oFile) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const sBase64 = e.target.result;
                    if (sId === "fileUploader1") {
                        oModel.setProperty("/to_Attachment/results/0/att_url", sBase64);
                        // aAttachments[0].att_url = sBase64;
                    } else if (sId === "fileUploader2") {
                        oModel.setProperty("/to_Attachment/results/1/att_url", sBase64);
                        // aAttachments[1].att_url = sBase64;
                    }
                    // aAttachments[0].att_url = sBase64;
                    // oModel.setProperty("/to_Attachment/results", aAttachments);
                };
                reader.readAsDataURL(oFile);
            }
        },

        onApproverChange: function (oEvent) {
            const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const aApprovers = oChecklistModel.getProperty("/to_Approver/results");
            const oPartnerVHModel = this.getView().getModel("partnerVH");
            // const aPartners = oPartnerVHModel.getProperty("/ZC_PM0001_Partners_VH");
            const sComboBoxId = oEvent.getSource().getId();

            oPartnerVHModel.read("/ZC_PM0001_Partners_VH", {
                filters: [new sap.ui.model.Filter("bp_id", sap.ui.model.FilterOperator.EQ, sSelectedKey)],
                success: function (oData) {
                    const oSelectedPartner = oData.results.find(partner => partner.bp_id === sSelectedKey);

                    let iIndex = 0;
                    if (sComboBoxId.endsWith("approver1-cmb")) {
                        iIndex = 0;
                    } else if (sComboBoxId.endsWith("approver2-cmb")) {
                        iIndex = 1;
                    } else if (sComboBoxId.endsWith("approver3-cmb")) {
                        iIndex = 2;
                    }
                    aApprovers[iIndex].bp_id = oSelectedPartner.bp_id;
                    aApprovers[iIndex].bp_name = oSelectedPartner.bp_name;
                    aApprovers[iIndex].bp_func = oSelectedPartner.bp_func;
                    // aApprovers[iIndex].bp_position = oSelectedPartner.bp_position;
                    oChecklistModel.setProperty("/to_Approver/results", aApprovers);
                },
                error: function (oError) {
                    console.error("Error fetching partner details: ", oError);
                }
            });
        },

        onLeaderChange: function (oEvent) {
            const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const aLeaders = oChecklistModel.getProperty("/to_Partner/results");
            let aExist = aLeaders.filter(function (el) {
                return el.bp_name.length > 0 && el.bp_id == sSelectedKey;
            });
            if (aExist.length > 0) {
                sap.m.MessageBox.error("Nama Leader sudah dipakai");
            }
            const oPartnerVHModel = this.getView().getModel("partnerVH");
            // const aPartners = oPartnerVHModel.getProperty("/ZC_PM0001_Partners_VH");
            oPartnerVHModel.read("/ZC_PM0001_Partners_VH", {
                filters: [new sap.ui.model.Filter("bp_id", sap.ui.model.FilterOperator.EQ, sSelectedKey)],
                success: function (oData) {
                    const oSelectedPartner = oData.results.find(partner => partner.bp_id === sSelectedKey);
                    // Update the selected leader's details
                    for (let i = 0; i < aLeaders.length; i++) {
                        if (aLeaders[i].bp_id === sSelectedKey) {
                            aLeaders[i].bp_id = oSelectedPartner.bp_id;
                            aLeaders[i].bp_name = oSelectedPartner.bp_name;
                            aLeaders[i].bp_func = oSelectedPartner.bp_func;
                            // aLeaders[i].bp_position = oSelectedPartner.bp_position;
                            break;
                        }
                    }
                    oChecklistModel.setProperty("/to_Partner/results", aLeaders);
                },
                error: function (oError) {
                    console.error("Error fetching partner details: ", oError);
                }
            });
        },

        onAddLeaderPress: function (oEvent) {
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const aLeaders = oChecklistModel.getProperty("/to_Partner/results");
            let sFound = "";
            for (let i = 0; i < aLeaders.length; i++) {
                let oLead = aLeaders[i]
                if (oLead.loekz == "X") {
                    aLeaders[i].loekz = "";
                    oChecklistModel.setProperty("/to_Partner/results", aLeaders);
                    sFound = "X";
                    break;
                }
            }
            if (sFound != "X") {
                sap.m.MessageToast.show("Jumlah inspector sudah maksimum.");
                return;
            }
            // const oView = this.getView();
            const oTblLeader = sap.ui.getCore().byId("table-leaders");
            const oBind = oTblLeader.getBinding("rows");
            if (oBind) {
                oBind.refresh(true);
            }
        },

        onDelLeaderPress: function (oEvent) {
            const oParent = oEvent.getSource().getParent();
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const oContext = oParent.getBindingContext("oChecklistModel");
            const sPath = oContext.getPath();
            if (sPath) {
                let oObject = oChecklistModel.getProperty(sPath);
                oObject.bp_id = "";
                oObject.bp_name = "";
                oObject.loekz = "X";
                oChecklistModel.setProperty(sPath, oObject)
                const oTblLeader = sap.ui.getCore().byId("table-leaders");
                const oBind = oTblLeader.getBinding("rows");
                if (oBind) {
                    oBind.refresh(true);
                }
            }
        },

        _onGroupCategorySelect: function (oEvent) {
            let oSelectedKey = oEvent.getParameter("selectedItem").getKey();
            let oCmbBox = oEvent.getSource();
            let sCategory = oCmbBox.data("category");
            let sColname = oCmbBox.data("colname");

            let aGroup = this._aRowModels.filter(function (el) {
                return el.category == sCategory;
            })

            if (aGroup.length > 0) {
                for (let rowModel of aGroup) {
                    const sRowModelName = rowModel.aufpl + "_" + rowModel.aplzl;
                    const oRowModel = this.getView().getModel(sRowModelName);
                    let sPropName = "/values/" + sColname + "/sval";
                    oRowModel.setProperty(sPropName, oSelectedKey);
                }
            }
        },

        _onActualDateChange: function (oEvent) {
            let oSource = oEvent.getSource();
            let sDateString = oSource.getValue();

            if (validator.dateIsFuture(sDateString)) {
                sap.m.MessageBox.error("Tanggal Actual tidak boleh di masa datang");
            }
        }
    });
});