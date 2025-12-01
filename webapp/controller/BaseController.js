sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zpmchecklist/control/Table02",
    "zpmchecklist/model/formatter"
    // "zpmchecklist/control/Column02",
    // "zpmchecklist/control/Row02",
    // "zpmchecklist/model/models"
], function (Controller, Table02, formatter) {  //, Column02, Row02, models) {
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
            for (let colData of this._oChecklistHeader.toColumn.results) {
                if (!colData.col_type || colData.is_hidden == "X") continue;
                let flexGrow = parseFloat(colData.col_grow === "" ? 0 : colData.col_grow);
                let colBasis = colData.col_basis || "auto";
                if (colData.has_subcol == "X") {
                    this._oSubcol = new sap.m.HBox();
                    this._oSpancol = new sap.m.VBox({
                        items: [
                            new sap.m.Text({
                                text: colData.col_label,
                                layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                            }),
                            this._oSubcol
                        ],
                        layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                    });
                    oColumn.addItem(this._oSpancol);
                } else {
                    const colLabel = new sap.m.Text({
                        text: colData.col_label,
                        layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                    });
                    if (colData.is_subcol == 'X') {
                        this._oSubcol.addItem(colLabel);
                    } else {
                        oColumn.addItem(colLabel);
                    }
                }
            }
            oTable.setColumn(oColumn);

            // const aItemCopy = oData.slice();
            // oData.sort(function (a, b) { return a.vornr - b.vornr });
            for (let taskData of oData) {
                // start build json model for rows
                // if (taskData.sumnr != '00000000') continue;
                const oRow = new sap.m.HBox({
                    alignContent: "Start",
                    justifyContent: "Start",
                    items: []
                });

                const sRowModelName = taskData.aufpl + "_" + taskData.aplzl;
                oRow.setModel(this.getView().getModel(sRowModelName));
                oRow.bindElement({ path: "/" });

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

                        if (taskData.ref_image) {
                            const oCellwithImage = new sap.m.VBox();
                            oCellwithImage.addItem(oCell);

                            const oImage = new sap.m.Image({
                                src: "{" + taskData.ref_image + "}",
                                width: "30px",
                                densityAware: false,
                                decorative: false,
                                // layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                detailBox: new sap.m.LightBox({
                                    imageSrc: "{" + taskData.ref_image + "}",
                                    title: "Image Detail",
                                    description: "Detailed view of the image."
                                })
                            });
                            oCellwithImage.addItem(oImage);
                            oRow.addItem(oCellwithImage);
                        } else {
                            oRow.addItem(oCell);
                        }
                    } else if (colData.col_type == 'A') {
                        if (taskData.steus == "INT") {
                            oCell = new sap.m.Input({
                                value: "{/values/" + cellKey + "}",
                                placeholder: "Entry value..",
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
                        // let sFound = false;
                        // for (let subOp of aItemCopy) {
                        //     if (subOp.sumnr != taskData.aplzl) continue;
                        //     if (subOp.cl_action == colData.col_name) {
                        //         sFound = true;
                        //         break;
                        //     }
                        // }

                        let aVals = taskData.column_list ? taskData.column_list.split(",").map(function (item) { return item.trim() }) : [];
                        let sFound = aVals.includes(colData.col_name);

                        if (taskData.ref_mpoint) {
                            if (!skipForMpoint) {
                                const mpointCol = this._oChecklistHeader.toColumn.results.find(function (col) {
                                    return col.col_name == "mpoint";
                                });
                                let mpointGrow = parseFloat(mpointCol.col_grow === "" ? 0 : colData.col_grow);
                                let mPointBasis = mpointCol.col_basis || "auto";
                                const oMpointBox = new sap.m.HBox({ layoutData: [new sap.m.FlexItemData({ baseSize: mPointBasis, growFactor: mpointGrow })] });
                                // const aPoint = ["mpoint", "atawe", "lower_limit", "upper_limit"];
                                for (let index = 0; index < aVals.length; index++) {
                                    const el = aVals[index];
                                    if (el == "mpoint") {
                                        oCell = new sap.m.Input({ value: "{/values/" + el + "}", placeholder: "Measure" });
                                    } else {
                                        oCell = new sap.m.Text({
                                            text: "{/values/" + el + "}", textAlign: "Center",
                                            layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                        });
                                    }
                                    oCell.setLayoutData(new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1 }));
                                    oMpointBox.addItem(oCell);
                                    skipForMpoint = true;
                                }
                                oRow.addItem(oMpointBox);
                            }
                        }

                        if (!skipForMpoint) {
                            if (taskData.steus == "INT1" || sFound) {
                                // }
                                // if (!sFound) {
                                //     oCell = new sap.m.Text({
                                //         text: "",
                                //         layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                                //     });
                                // } else {
                                oCell = new sap.m.ComboBox({
                                    width: colBasis,
                                    selectedKey: "{/values/" + cellKey + "}",
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
                            oRow.addItem(oCell);
                        }
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
            const oHeader = new sap.m.VBox({
                width: "90%",
                items: [
                    new sap.m.VBox({
                        items: [
                            new sap.m.HBox({
                                width: "50%",
                                items: [
                                    new sap.m.Text({
                                        text: "Order", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                    }),
                                    new sap.m.Text({
                                        text: "(aufnr}", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                    })
                                ]
                            }),
                            new sap.m.HBox({
                                width: "50%",
                                items: [
                                    new sap.m.Text({
                                        text: "Func. Loc", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                    }),
                                    new sap.m.Text({
                                        text: "{pltxt}",
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
                                        text: "{equnr}", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                    })
                                ]
                            }),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.HBox({
                                        width: "50%",
                                        items: [
                                            new sap.m.Text({
                                                text: "Planner Group", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                            }),
                                            new sap.m.Text({
                                                text: "{ingpr}", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                            })]
                                    }),
                                    new sap.m.HBox({
                                        items: [
                                            new sap.m.Text({
                                                text: "Bsc Start", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                            }),
                                            new sap.m.Text({
                                                text: "{gstrp}", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                            })]
                                    })
                                ]
                            }),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.HBox({
                                        width: "50%",
                                        items: [
                                            new sap.m.Text({
                                                text: "Mn.wk.ctr", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                            }),
                                            new sap.m.Text({
                                                text: "{arbpl}", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                            })]
                                    }),
                                    new sap.m.HBox({
                                        items: [
                                            new sap.m.Text({
                                                text: "Basic fin.", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                            }),
                                            new sap.m.Text({
                                                text: "{gltrp}", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                            })]
                                    })
                                ]
                            }),
                            new sap.m.HBox({
                                width: "50%",
                                items: [
                                    new sap.m.Text({
                                        text: "PM Act. Type", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })]
                                    }),
                                    new sap.m.Text({
                                        text: "{ilart}", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })]
                                    })
                                ]
                            }),
                        ]
                    })
                ]
            });
            oHeader.setModel(this.getView().getModel("oChecklistHeaderModel"));
            oHeader.bindElement({ path: "/" });

            const oLeaders = new Table02("tableLeaders", {
                title: "Inspector (Leader)",
                showTitle: true,
                headerToolbar: new sap.m.Toolbar({
                    content: [
                        new sap.m.Title({ text: "Inspector (Leader)" }),
                        new sap.m.ToolbarSpacer(),
                        new sap.m.Button("add-leader-btn", {
                            icon: "sap-icon://add",
                            visible: { path: "oViewModel>/isNew" },
                            press: this.onAddLeaderPress
                        })
                    ]
                }),
                column: [
                    new sap.m.HBox({
                        alignContent: "SpaceAround",
                        justifyContent: "SpaceAround",
                        items: [
                            new sap.m.Text({ text: "Name" }),
                            new sap.m.Text({ text: "Title" }),
                            new sap.m.Text({ text: "Signature" })
                        ]
                    })
                ],
                rows: {
                    path: "oChecklistModel>/to_Partner/results",
                    template: new sap.m.HBox({
                        alignContent: "SpaceAround",
                        justifyContent: "SpaceAround",
                        items: [
                            new sap.m.ComboBox({
                                width: "100%",
                                items: {
                                    path: "partnerVH>/ZC_PM0001_Partners_VH",
                                    template: new sap.ui.core.Item({
                                        key: "{partnerVH>bp_name}",
                                        text: "{partnerVH>bp_name}"
                                    }),
                                    templateShareable: true
                                },
                                selectedKey: "{oChecklistModel>bp_name}",
                                selectionChange: this.onLeaderChange.bind(this)
                                // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                            }),
                            new sap.m.Text({ text: "{oChecklistModel>bp_func}" }),
                            new sap.m.Text({ text: "" })
                        ]
                    }),
                    templateShareable: false
                }
            });
            // let oLeaderTemplate = new sap.m.HBox({
            //     alignContent: "SpaceAround",
            //     justifyContent: "SpaceAround",
            //     items: [
            //         new sap.m.ComboBox({
            //             width: "100%",
            //             items: {
            //                 path: "partnerVH>/ZC_PM0001_Partners_VH",
            //                 template: new sap.ui.core.Item({
            //                     key: "{partnerVH>bp_name}",
            //                     text: "{partnerVH>bp_name}"
            //                 }),
            //                 templateShareable: true
            //             },
            //             selectedKey: "{oChecklistModel>bp_name}",
            //             selectionChange: this.onLeaderChange.bind(this)
            //             // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
            //         }),
            //         new sap.m.Text({ text: "{oChecklistModel>bp_func}" }),
            //         new sap.m.Text({ text: "{oChecklistModel>bp_position}" })
            //     ]
            // })
            // oLeaders.bindAggregation("rows", {
            //     path: "oChecklistModel>/to_Partner/results",
            //     template: oLeaderTemplate,
            //     templateShareable: false
            // });
            oHeader.addItem(oLeaders);
            oHeaderContainer.addItem(oHeader);
        },

        _buildFooter: function (oData, oFooterContainer) {
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
                        items: [
                            new sap.m.ComboBox("approver1-combobox", {
                                width: "100%",
                                items: {
                                    path: "partnerVH>/ZC_PM0001_Partners_VH",
                                    template: new sap.ui.core.Item({
                                        key: "{partnerVH>bp_id}",
                                        text: "{partnerVH>bp_name}"
                                    }),
                                    templateShareable: true
                                },
                                selectionChange: this.onApproverChange,
                                // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                            }),
                            new sap.m.ComboBox("approver2-combobox", {
                                width: "100%",
                                items: {
                                    path: "partnerVH>/ZC_PM0001_Partners_VH",
                                    template: new sap.ui.core.Item({
                                        key: "{partnerVH>bp_id}",
                                        text: "{partnerVH>bp_name}"
                                    }),
                                    templateShareable: true
                                },
                                selectionChange: this.onApproverChange
                                // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                            }),
                            new sap.m.ComboBox("approver3-combobox", {
                                width: "100%",
                                items: {
                                    path: "partnerVH>/ZC_PM0001_Partners_VH",
                                    template: new sap.ui.core.Item({
                                        key: "{partnerVH>bp_id}",
                                        text: "{partnerVH>bp_name}"
                                    }),
                                    templateShareable: true
                                },
                                selectionChange: this.onApproverChange
                                // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                            })
                        ]
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
            const oRowModelData = this._aRowModels[0];
            // const oChecklistModel = this.getView().getModel("oChecklistModel").getData();
            const oImageBox = new sap.m.VBox({
                width: "80%",
                items: [
                    new sap.m.HBox("image-box", {
                        // minHe: "20em",
                        alignItems: "Center",
                        justifyContent: "SpaceAround",
                        items: [
                            new sap.m.VBox("image-box-1", {
                                width: "50%",
                                items: [
                                    new sap.m.Image({ src: "{oChecklistModel>/to_Attachment/results/0/att_url}", height: "20em" }),
                                    new sap.m.HBox({
                                        items: [
                                            new sap.ui.unified.FileUploader("fileUploader1", {
                                                width: "100%",
                                                buttonOnly: true,
                                                buttonText: "Browse",
                                                fileType: ["jpg", "jpeg", "png"],
                                                maximumFileSize: 5, // in MB
                                                change: this.onFileChange,
                                                uploadUrl: "oChecklistModel>/to_Attachment/results/0/att_url}",
                                                name: oRowModelData.aufpl + "_image1",
                                                // uploadOnChange: true,
                                                uploadComplete: this.handleUpload
                                            })
                                        ],
                                        layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                    })
                                ]
                            }),
                            new sap.m.VBox("image-box-2", {
                                width: "50%",
                                items: [
                                    new sap.m.Image({ src: "{oChecklistModel>/to_Attachment/results/1/att_url}", height: "20em" }),
                                    new sap.m.HBox({
                                        items: [
                                            new sap.ui.unified.FileUploader("fileUploader2", {
                                                width: "100%",
                                                buttonOnly: true,
                                                buttonText: "Browse",
                                                fileType: ["jpg", "jpeg", "png"],
                                                maximumFileSize: 5, // in MB
                                                change: this.onFileChange,
                                                uploadUrl: "oChecklistModel>/to_Attachment/results/1/att_url}",
                                                name: oRowModelData + "image2",
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
            const aAttachments = oModel.getProperty("/to_Attachment/results");
            if (oFile) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const sBase64 = e.target.result;
                    if (sId === "fileUploader1") {
                        aAttachments[0].att_url = sBase64;
                    } else if (sId === "fileUploader2") {
                        aAttachments[1].att_url = sBase64;
                    }
                    // aAttachments[0].att_url = sBase64;
                    oModel.setProperty("/to_Attachment/results", aAttachments);
                };
                reader.readAsDataURL(oFile);
            }
        },

        onApproverChange: function (oEvent) {
            const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            // Implement your logic here based on the selected approver
            console.log("Selected Approver Key: " + sSelectedKey);
        },

        onLeaderChange: function (oEvent) {
            const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const aLeaders = oChecklistModel.getProperty("/to_Partner/results");
            const oPartnerVHModel = this.getView().getModel("partnerVH");
            // const aPartners = oPartnerVHModel.getProperty("/ZC_PM0001_Partners_VH");
            oPartnerVHModel.read("/ZC_PM0001_Partners_VH", {
                filters: [new sap.ui.model.Filter("bp_name", sap.ui.model.FilterOperator.EQ, sSelectedKey)],
                success: function (oData) {
                    const oSelectedPartner = oData.results.find(partner => partner.bp_name === sSelectedKey);
                    // Update the selected leader's details
                    for (let i = 0; i < aLeaders.length; i++) {
                        if (aLeaders[i].bp_name === sSelectedKey) {
                            // aLeaders[i].bp_id = oSelectedPartner.bp_id;
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

        onAddLeaderPress: function () {
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const aLeaders = oChecklistModel.getProperty("/to_Partner/results");
            const oLeader = {
                chkid: "",
                chkno: "",
                aufnr: "",
                itemno: aLeaders.length + 1,
                bp_name: "",
                bp_func: "",
                bp_position: "leader",
                keydate: "",
                start_time: "",
                finish_time: ""
            }
            aLeaders.push(oLeader);
            oChecklistModel.setProperty("/to_Partner/results", aLeaders);
        }
    });
});