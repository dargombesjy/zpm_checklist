sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zpmchecklist/control/Table02",
    // "zpmchecklist/control/Column02",
    // "zpmchecklist/control/Row02",
    // "zpmchecklist/model/models"
], function (Controller, Table02) {  //, Column02, Row02, models) {
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
                // const colLabel = new sap.m.Text({text: colData.col_label});
                // oColumn.addItem(colLabel);
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
            oTable.addRow(oColumn);

            const aItemCopy = oData.slice();
            let iItemPos = 0;
            for (let taskData of oData) {
                // start build json model for rows
                if (taskData.sumnr != '00000000') continue;
                iItemPos += 1;
                const oRow = new sap.m.HBox({
                    alignContent: "Stretch",
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
                    let colBasis = colData.col_basis || "auto";
                    let cellKey = colData.col_name;
                    if (colData.col_type == "L") {
                        oCell = new sap.m.Text({
                            text: taskData[colData.col_name],
                            layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                        });
                        oRow.addItem(oCell);
                    } else if (colData.col_type == 'A') {
                        oCell = new sap.m.Input({
                            value: "{/values/" + cellKey + "}",
                            placeholder: "Entry value..",
                            layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                        });
                        oRow.addItem(oCell);
                    } else if (colData.col_type == "V") {
                        let sFound = false;
                        for (let subOp of aItemCopy) {
                            if (subOp.sumnr != taskData.aplzl) continue;
                            if (subOp.cl_action == colData.col_name) {
                                sFound = true;
                                break;
                            }
                        }

                        if (taskData.ref_mpoint) {
                            if (!skipForMpoint) {
                                const mpointCol = this._oChecklistHeader.toColumn.results.find(function (col) {
                                    return col.col_name == "mpoint";
                                });
                                let mpointGrow = parseFloat(mpointCol.col_grow === "" ? 0 : colData.col_grow);
                                let mPointBasis = mpointCol.col_basis || "auto";
                                const oMpointBox = new sap.m.HBox({ layoutData: [new sap.m.FlexItemData({ baseSize: mPointBasis, growFactor: mpointGrow })] });
                                const aPoint = ["mpoint", "atawe", "upper_limit", "lower_limit"];
                                for (let index = 0; index < aPoint.length; index++) {
                                    const el = aPoint[index];
                                    if (el == "mpoint") {
                                        oCell = new sap.m.Input({ value: "{/values/" + el + "}", placeholder: "Measure" });
                                    } else {
                                        oCell = new sap.m.Text({ text: "{/values/" + el + "}" });
                                    }
                                    oCell.setLayoutData(new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1 }));
                                    oMpointBox.addItem(oCell);
                                    skipForMpoint = true;
                                }
                                oRow.addItem(oMpointBox);
                            }
                        }
                        if (!skipForMpoint) {
                            if (!sFound) {
                                oCell = new sap.m.Text({
                                    text: "",
                                    layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                                });
                            } else {
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
                            }
                            oRow.addItem(oCell);
                        }
                    }
                }
                oTable.addRow(oRow);
            };

            oTableWrapper.addItem(oTable);
            oTableContainer.addItem(oTableWrapper);
            // oChecklistContainer.addItem(oTableContainer);
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
                                items: [
                                    new sap.m.Text({
                                        text: "Description", layoutData: [
                                            new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })
                                        ]
                                    }),
                                    new sap.m.Text({
                                        text: "", layoutData: [
                                            new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })
                                        ]
                                    })
                                ]
                            }),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.Text({
                                        text: "Trainset No.", layoutData: [
                                            new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })
                                        ]
                                    }),
                                    new sap.m.Text({
                                        text: "", layoutData: [
                                            new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })
                                        ]
                                    })
                                ]
                            }),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.Text({
                                        text: "Details", layoutData: [
                                            new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })
                                        ]
                                    }),
                                    new sap.m.Text({
                                        text: "", layoutData: [
                                            new sap.m.FlexItemData({ baseSize: "30%", growFactor: 2 })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })                    // new sap.m.Title("inspector-title", {
                    //     text: "Inspector (Leader)", textAlign: "Center",
                    //     layoutData: [
                    //         new sap.m.FlexItemData({ alignSelf: "Center", styleClass: "header-row" })
                    //     ]
                    // })
                ]
            });

            const oLeaders = new Table02({
                id: "tableLeaders",
                title: "Inspector (Leader)",
                showTitle: true,
                column: [
                    new sap.m.HBox({
                        alignContent: "SpaceAround",
                        justifyContent: "SpaceAround",
                        items: [
                            new sap.m.Text({ text: "Name" }),
                            new sap.m.Text({ text: "Title" }),
                            // new sap.m.Text({ text: "Start Time" }),
                            // new sap.m.Text({ text: "Finish Time" }),
                            new sap.m.Text({ text: "Signature" })
                        ]
                    })
                ],
                rows: {
                    path: "oChecklistModel>/to_Partner",
                    template: new sap.m.HBox({
                        alignContent: "SpaceAround",
                        justifyContent: "SpaceAround",
                        items: [
                            new sap.m.ComboBox({
                                width: "100%",
                                // selectedKey: "{/values/" + cellKey + "}",
                                // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                            }),
                            new sap.m.Text({ text: "" }),
                            // new sap.m.DatePicker({ value: "{oChecklistModel>date}" }),
                            // new sap.m.TimePicker({ value: "{oChecklistModel>start_time}" }),
                            // new sap.m.TimePicker({ value: "{oChecklistModel>finish_time}" }),
                            new sap.m.Text({ text: "" })
                        ]
                    }),
                    templateShareable: false
                }
            })
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
                            new sap.m.Text({ text: "Checked By,"
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
                                selectionChange: this.onApproverChange,
                                // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                            }),
                            new sap.m.ComboBox("approver2-combobox", {
                                width: "100%",
                                selectionChange: this.onApproverChange
                                // layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                            }),
                            new sap.m.ComboBox("approver3-combobox", {
                                width: "100%",
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
                                    new sap.m.Image({ src: "{oChecklistModel>/to_Attachment/0/att_url}", height: "20em" }),
                                    new sap.m.HBox({
                                        items: [
                                            new sap.ui.unified.FileUploader("fileUploader1", {
                                                width: "100%",
                                                buttonOnly: true,
                                                buttonText: "Browse",
                                                fileType: ["jpg", "jpeg", "png"],
                                                maximumFileSize: 5, // in MB
                                                change: this.onFileChange,
                                                uploadUrl: "oChecklistModel>/to_Attachment/0/att_url}",
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
                                    new sap.m.Image({ src: "{oChecklistModel>/to_Attachment/1/att_url}", height: "20em" }),
                                    new sap.m.HBox({
                                        items: [
                                            new sap.ui.unified.FileUploader("fileUploader2", {
                                                width: "100%",
                                                buttonOnly: true,
                                                buttonText: "Browse",
                                                fileType: ["jpg", "jpeg", "png"],
                                                maximumFileSize: 5, // in MB
                                                change: this.onFileChange,
                                                uploadUrl: "oChecklistModel>/to_Attachment/1/att_url}",
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
            const aAttachments = oModel.getProperty("/to_Attachment");
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
                    oModel.setProperty("/to_Attachment", aAttachments);
                };
                reader.readAsDataURL(oFile);
            }
        },

        onApproverChange: function (oEvent) {
            const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            // Implement your logic here based on the selected approver
            console.log("Selected Approver Key: " + sSelectedKey);
        }
    });
});