// -- Global Editor Variables -- //
var debug, code, previous, editor, nav, _;
var hash = new Hashes.MD5(),
	shash = new Hashes.SHA1(),
	changed = {},
	saved = {},
	deleted = {};
// -- Global Variables -- //

$(function() {

	// -- Get Debug -- //
	debug = ($.url().param("debug") === "" || $.url().fparam("debug") === "");
	dev = ($.url().attr("host").split(".")[0] == "dev");

	// -- Set Up LocalForage -- //
	localforage.config({
		name: "Scriptr-Space"
	});

	// -- Set Up Hello.js -- //
	hello.init({
		github: dev ? "0e6afe63555ffc47107b" : "770cdacd6fa33a1a269d",
	}, {
		redirect_uri: "redirect",
		oauth_proxy: 'https://auth-server.herokuapp.com/proxy'
	});

	// == Functions == //
	var status = function(id) { // -- Handle Changes to Edited Document -- //
		if (id in saved) {
			return "status-saved";
		} else if (id in changed) {
			return "status-changed";
		} else {
			return "";
		}
	}

	var force = function(file) {
		if (file) {
			localforage.setItem(file.id, file.source).then(function(value) {
				changed[file.id] = value;
				if (nav) nav.change(file.id, "status-changed");
			}).catch(function(err) {
				if (debug) console.log("LOCAL_FORAGE ERROR", err);
			});
		}
	}

	var change = function(value) { // -- Handle Changes to Edited Document -- //

		if (code && code.hash != hash.hex(value)) {

			localforage.setItem(code.file.id, value).then(function(value) {
				changed[code.file.id] = value;
				if (nav) nav.change(code.file.id, "status-changed");
			}).catch(function(err) {
				if (debug) console.log("LOCAL_FORAGE ERROR", err);
			});

		} else {

			localforage.removeItem(code.file.id).then(function(value) {
				delete changed[code.file.id];
				if (nav) nav.change(code.file.id, "");
			}).catch(function(err) {
				if (debug) console.log("LOCAL_FORAGE ERROR", err);
			});

		}

	}

	var loaded = function(name, value, script, file, files, index, interaction, editable) { // -- Handles a loaded file/script -- //

		$("#path").empty().append($("<span />", {
			text: name
		}));
		previous = undefined;

		if (interaction) {

			if (editable) {
				editor.setValue(value, editor.Modes.interact, undefined).unprotect().focus(); // Set it to read-only
			} else {
				editor.setValue(value, editor.Modes.interact, undefined).protect().focus(); // Set it to read-only	
			}

		} else if (script && file) {

			// Instantiate the code object
			code = {
				hash: hash.hex(value),
				value: value,
				index: index,
				file: file,
				script: script,
				git: function() {
					return this.script.files.find(function(f) {
						return (f.name == ".git")
					})
				},
			};

			// Allow for pseudo-extensions when building web-apps
			if (file.name == ".git") {
				code.mode = editor.Modes.yaml;
			} else if (file.name.endsWith(".js")) {
				code.mode = editor.Modes.gas_html_js; // Need to ignore open/close script tags
			} else if (file.name.endsWith(".css")) {
				code.mode = editor.Modes.gas_html_css // Need to ignore open/close style tags
			} else {
				code.mode = file.type == "html" ? editor.Modes.html : file.type == "server_js" ?
					editor.Modes.gas : editor.Modes.text;
			}
			code.script.files = files.filter(
				function(file) {
					return !(file.id in deleted);
				}
			);

			value = file.id in changed &&
				hash.hex(changed[file.id]) != hash.hex(value) ? changed[file.id] : value;

			editor.setValue(value, code.mode, change).unprotect().focus(); // Set it to read-write

		} else {

			code = undefined;
			editor.setValue(value, editor.Modes.markdown, undefined).protect().focus(); // Set it to read-only

		}

	}

	var create = function(html_type) { // -- Handle Create File in Script -- //

		if (code) {

			nav.busy(code.script.id, "create");

			code.script.files.push({
				name: "Code_" + uuid.v4().substr(32),
				source: "var foo = function(bar) {};",
				type: html_type ? "html" : "server_js",
			});

			gapi.client.request({
				path: "/upload/drive/v3/files/" + code.script.id,
				method: "PATCH",
				params: {
					uploadType: "media"
				},
				body: JSON.stringify({
					files: code.script.files
				}),
			}).then(function() {

				nav.busy(code.script.id).reload(code.script, code.script.files[code.script.files.length - 1].name);

			}, function(err) {

				if (debug) console.log("SAVING ERROR", err);

				nav.busy(code.script.id).error(code.script.id, err);

			});

		}

	}

	var remove = function() { // -- Handle Remove File in Script -- //

		if (nav && code && code.file) {

			if (nav.is(code.file.id, "status-condemned")) {

				nav.change(code.file.id).busy(code.file.id, "delete");

				code.script.files = code.script.files.filter(
					function(file) {
						return file.id !== code.file.id;
					}
				);

				gapi.client.request({
					path: "/upload/drive/v3/files/" + code.script.id,
					method: "PATCH",
					params: {
						uploadType: "media"
					},
					body: JSON.stringify({
						files: code.script.files
					}),
				}).then(function() {

					localforage.removeItem(code.file.id).then(function() {

						delete changed[code.file.id];
						deleted[code.file.id] = true;
						nav.busy(code.file.id).change(code.file.id, "status-deleted", 4000, true).select(code.script, code.index);

					}).catch(function(err) {
						if (debug) console.log("LOCAL_FORAGE ERROR", err);
						nav.busy(code.file.id).error(code.file.id, err);
					});

				}, function(err) {

					if (debug) console.log("DELETING ERROR", err);
					nav.busy(code.file.id).error(code.file.id, err);

				});

			} else {

				nav.change(code.file.id, "status-condemned", 2000);

			}
		}
	}

	var abandon = function() { // -- Handle Abandon Local Changes to a File in Script -- //

		if (nav && code && code.file && changed[code.file.id]) {

			if (nav.is(code.file.id, "status-imperilled")) {

				localforage.removeItem(code.file.id).then(function() {
					delete changed[code.file.id];
					nav.change(code.file.id, "status-abandoned", 2000);
					editor.setValue(code.file.source, code.mode, change).unprotect();
				}).catch(function(err) {
					if (debug) console.log("LOCAL_FORAGE ERROR", err);
					nav.error(code.file.id, err);
				});

			} else {

				nav.change(code.file.id, "status-imperilled", 2000);

			}
		}
	}

	var save = function(all) { // -- Handle Save Script -- //

		if (code) {

			var saving;
			previous = undefined;

			code.script.files.forEach(function(file) {

				if ((all || code.file.id == file.id) && changed[file.id]) {

					// -- Update the Script code to save with the changed value -- //
					if (!saving) saving = {};
					saving[file.id] = file.source;

					// Remove Meta / Git
					if (file.meta) delete file.meta;
					if (file.git) delete file.git;

					file.source = changed[file.id];

				}

			})

			// -- Do the save / patch -- //
			if (saving) {

				if (nav && code) nav.busy(all ? code.script.id : code.file.id, "save");

				gapi.client.request({
					path: "/upload/drive/v3/files/" + code.script.id,
					method: "PATCH",
					params: {
						uploadType: "media"
					},
					body: JSON.stringify({
						files: code.script.files
					}),
				}).then(function() {

					Object.keys(saving).forEach(function(id) {
						localforage.removeItem(id).then(function() {
							delete changed[id];
							if (nav) nav.change(id, "status-saved", 5000);
						}).catch(function(err) {
							if (debug) console.log("LOCAL_FORAGE ERROR", err);
						});
					});

					if (nav) nav.busy(all ? code.script.id : code.file.id);

				}, function(err) {

					if (debug) console.log("SAVING ERROR", err);

					// -- Roll back changes -- //
					code.script.files.forEach(function(file) {
						if (saving[file.id]) file.source = saving[file.id];
					});

					if (nav) nav.busy(all ? code.script.id : code.file.id)
						.error(all ? code.script.id : code.file.id, err);

				});

			}

		}

	}

	var repository = function(repo, meta) {

		meta.repositories += "\n\n";
		meta.line += 2;

		var _owner = repo.owner.login;
		meta.repositories += ("*\t" + (repo.selected ? "[x]" : (repo.permissions.push ? "[ ]" : "[o]")) + "\t" + repo.name + (_owner ? " (" + _owner + ")" : ""));

		meta.lines["Line_" + meta.line] = repo.fullName;

		if (repo.description) {
			meta.repositories += ("\n\t\t" + repo.description);
			meta.line += 1;
			meta.lines["Line_" + meta.line] = repo.fullName;
		}

		return meta;
	}

	var repositories = function(instructions, code, response, selected, file_Name, display_Details, octo) {

		instructions = instructions.replace(new RegExp(RegExp.escape("{{DETAILS}}"), "g"),
			selected ? "You have currently selected repo: __" + selected.fullName + "__" : "You haven't yet selected any repos.");

		var meta = {
			line: instructions.split(/\r\n|\r|\n/).length - 1,
			lines: {},
			repositories: "",
			instructions: instructions
		};

		var all_Repos = []; // Hold all repositories for selection.

		var _continue = function() {
			editor.addCommand("Select Repo", "Space", "Space", (function(code, repos) {
				return function(ed) {

					if (repos) {

						var selected_Row = ed.selection.lead.row,
							_selected_Repo;
						if (meta.lines["Line_" + selected_Row]) {
							if (debug) console.log("SELECTED REPO:", meta.lines["Line_" + selected_Row]);
							for (var i = 0; i < repos.length; i++) {

								if (repos[i].fullName == meta.lines["Line_" + selected_Row] && repos[i].permissions.push) {

									repos[i].selected = true;
									_selected_Repo = repos[i];

									if (display_Details) { // Next stage is to show repo info

										editor.addCommand("Show Repo", "Ctrl-Enter", "Ctrl-Enter", (function(repo, code) {
											return function(ed) {
												if (repo) {
													if (debug) console.log("DISPLAY REPO:", repo);
													editor.removeCommand("Select Repo").removeCommand("Show Repo");

													$.ajax({
														url: "interact/REPOSITORY.md",
														type: "get",
														dataType: "html",
														async: true,
														success: function(result) {
															repo.branches.fetch().then(function(branches) {
																var _branch_Count = branches.items.length;
																var _branches = [];
																var _continue = function() {
																	loaded("Repository Details", result.replace(new RegExp(
																			RegExp.escape("{{DETAILS}}"), "g"),
																		jsyaml.safeDump({
																			"Repo Name": repo.fullName,
																			"Branches": _branches
																		})), _, _, _, _, _);
																}

																branches.items.forEach(function(branch) {
																	var _branch = {
																		Name: branch.name,
																		"Last Author": "",
																		"Last Message": "",
																		Total: 0,
																		Lines: {}
																	};
																	repo.commits(branch.commit.sha).fetch().then(function(commit) {
																		_branch["Last Author"] = commit.commit.author.name;
																		_branch["Last Message"] = commit.commit.message;
																		repo.git.trees(commit.commit.tree.sha).fetch({
																			recursive: 1
																		}).then(function(tree) {
																			var file_Total = tree.tree.length,
																				file_Count = 0;
																			if (file_Total === 0) {
																				_branches.push(_branch);
																				if (debug) console.log("COMPLETED BRANCH:", _branch.Name);
																				if (_branches.length == _branch_Count) _continue();
																			} else {
																				tree.tree.forEach(function(file) {
																					if (file.mode == "100644") {
																						repo.git.blobs(file.sha).fetch().then(function(blob) {
																							if (blob.content) {
																								if (!file.path.toLowerCase().endsWith(".png") &&
																									!file.path.toLowerCase().endsWith(".jpg") &&
																									!file.path.toLowerCase().endsWith(".jpeg") &&
																									!file.path.toLowerCase().endsWith(".bmp") &&
																									!file.path.toLowerCase().endsWith(".gif") &&
																									!file.path.toLowerCase().endsWith(".svg") &&
																									!file.path.toLowerCase().endsWith(".ico") &&
																									!file.path.toLowerCase().endsWith(".dll") &&
																									!file.path.toLowerCase().endsWith(".exe")) {

																									var _lines = blob.content.split(/\r\n|\r|\n/).length;
																									if (!_branch.Lines[file.path]) {
																										_branch.Lines[file.path] = _lines;
																										_branch.Total += _lines;
																									}

																								}
																							}
																							file_Count += 1;
																							if (file_Count == file_Total) {
																								_branches.push(_branch);
																								if (debug) console.log("COMPLETED BRANCH:", _branch.Name);
																								if (_branches.length == _branch_Count) _continue();
																							}
																						}, function(err) {
																							file_Count += 1;
																							if (file_Count == file_Total) {
																								_branches.push(_branch);
																								if (debug) console.log("COMPLETED BRANCH:", _branch.Name);
																								if (_branches.length == _branch_Count) _continue();
																							}
																						});
																					} else {
																						file_Count += 1;
																						if (file_Count == file_Total) {
																							_branches.push(_branch);
																							if (_branches.count == _branch_Count) _continue();
																						}
																					}
																				})
																			}

																		});
																	});

																})
															});
														}
													});

												}
											};

										})(_selected_Repo, code));

									} else { // Next stage is to write .git

										editor.addCommand("Configure Repo", "Ctrl-Enter", "Ctrl-Enter", (function(repo, code) {
											return function(ed) {
												if (repo) {
													if (debug) console.log("CONFIRMED REPO:", repo);
													editor.removeCommand("Select Repo").removeCommand("Configure Repo");

													var now = new Date().toISOString();
													var git = {
														repo: {
															owner: repo.owner.login,
															name: repo.name,
														},
														created: now,
														type: "COMMIT",
														exclude: [".git"],
														exceptions: [{
															id: uuid.v4() + " | GOOGLE DRIVE ID OF SCRIPT+FILE",
															name: uuid.v4().substr(0, 8) + ".gs | ID will be preferred over NAME (if available)",
															description: "Random Example File",
															repo: {
																owner: repo.owner.login + " | OR ANOTHER",
																name: repo.name + " | OR ANOTHER",
															},
															type: "COMMIT | CLONE",
														}],
														last: {},
														log: [{
															name: "Configured",
															when: now,
														}],
													};

													// == Create .git file and configure ==
													code.script.files.push({
														name: ".git",
														source: jsyaml.safeDump(git),
														type: "html",
													});

													gapi.client.request({
														path: "/upload/drive/v3/files/" + code.script.id,
														method: "PATCH",
														params: {
															uploadType: "media"
														},
														body: JSON.stringify({
															files: code.script.files
														}),
													}).then(function() {

														nav.reload(code.script);

													}, function(err) {

														if (debug) console.log("SAVING ERROR", err);

													});

												}
											};

										})(_selected_Repo, code));

									}

								} else {

									repos[i].selected = false;

								}

							}

							// -- Re-Call Function to Display Selected Repo -- //
							$.ajax({
								url: file_Name,
								type: "get",
								dataType: "html",
								async: true,
								success: function(result) {
									repositories(result, code, repos, _selected_Repo, file_Name, display_Details, octo); // Display Repos List
								}
							});

						}
					}
				};
			})(code, all_Repos));

			loaded("Select Target Repo", meta.instructions.replace(new RegExp(RegExp.escape("{{REPOSITORIES}}"), "g"),
				meta.repositories), _, _, _, _, true);

		}

		if (selected) {

			response.forEach(function(repo) {
				meta = repository(repo, meta);
				all_Repos.push(repo);
			});
			_continue();

		} else {

			// -- Iterate to Display Current Page of Repos -- //
			response.items.forEach(function(repo) {
				meta = repository(repo, meta);
				all_Repos.push(repo);
			});

			// -- Iterate to Display Next Page/s of Repos -- //
			var _iterate = function(response) {
				response.nextPage.fetch().then(function(response) {
					response.items.forEach(function(repo) {
						meta = repository(repo, meta);
						all_Repos.push(repo);
					});
					if (response.nextPage) {
						_iterate(response);
					} else {
						_continue();
					}
				})
			}

			// -- Kick off the iteration -- //
			if (response.nextPage) {
				_iterate(response);
			} else {
				_continue();
			}

		}


	}

	var files = function(instructions, code, all, octo, git) {

		var _id = code.script.id;
		var _list = "",
			meta = {
				line: instructions.split(/\r\n|\r|\n/).length - 1,
				lines: {}
			};
		var _last;

		all.forEach(function(file) {

			if (git.exclude.indexOf(file.name) < 0 && git.exclude.indexOf(file.id)) {

				if (!file.git) file.git = {}; // Create objects if not already present
				if (!file.git.repo) file.git.repo = {}; // Create objects if not already present
				file.git.exception = git.exceptions ? git.exceptions.find(function(exception) {
					return exception.id == file.id || exception.name == file.name
				}) : null;
				file.git.direction = file.git.exception ? file.git.exception.type : git.type;
				file.git.repo.name = file.git.exception ? file.git.exception.repo.name : git.repo.name;
				file.git.repo.owner = file.git.exception ? file.git.exception.repo.owner : git.repo.owner;

				var _repo = file.git.repo.owner + "/" + file.git.repo.name;

				_list += ("\n*\t" +
					(file.git.selected ? "[x]" : file.git.changed || file.git.new ? "[ ]" : "[o]") +
					"\t" + file.name +
					(file.git.new && file.git.direction == "COMMIT" ? "  ☆" : "") +
					(file.git.changed || file.git.new ? file.git.direction == "CLONE" ? "  ⇦" : "  ➡" : "") +
					(file.git.changed || file.git.new ? _repo != _last ? ("  __" + _repo + "__") : "" : "")
				);

				_last = _repo;
				meta.line += 1;
				meta.lines["Line_" + meta.line] = file.name;

			}

		});

		var _display = instructions.replace(new RegExp(RegExp.escape("{{FILES}}"), "g"), _list);

		editor.addCommand("Select Files", "Space", "Space", (function(code, all, instructions) {
			return function(ed) {

				var _file = meta.lines["Line_" + ed.selection.lead.row];

				if (_file) {

					var _selected = all.find(function(file) {
						return file.name == _file
					});
					if (_selected && (_selected.git.changed || _selected.git.new)) {

						if (debug) console.log("SELECTED FILE:", _selected);
						_selected.git.selected = !_selected.git.selected; // Reverse Selection

						// -- Cancel Commit -- //
						editor.addCommand("Commit", "Ctrl-X", "Ctrl-C", (function(code) {
							return function(ed) {
								editor.removeCommand("Select Files").removeCommand("Review").removeCommand("Cancel"); // Remove other Commands
								nav.reload(code.script);
							};
						})(code));
						// -- Cancel Commit -- //

						// -- Review Commit -- //
						editor.addCommand("Review", "Ctrl-Enter", "Ctrl-Enter", (function(code, selected) {
							return function(ed) {
								editor.removeCommand("Select Files").removeCommand("Review").removeCommand("Cancel"); // Remove other Commands

								$.ajax({
									url: "interact/REVIEW.md",
									type: "get",
									dataType: "html",
									async: true,
									success: function(result) {

										var _list = "",
											_message = "Add/Update -";
										selected.forEach(function(file) {
											_list += ("\n*\t" + file.name + (file.git.direction == "CLONE" ? "  ⇦" : "  ➡"));
											_message += (" " + file.name);
										});
										result = result
											.replace(new RegExp(RegExp.escape("{{MESSAGE}}"), "g"), _message)
											.replace(new RegExp(RegExp.escape("{{FILES}}"), "g"), _list);

										loaded("Commit to Github -- Review", result, _, _, _, _, true, true);

										// -- Cancel Commit -- //
										editor.addCommand("Cancel", "Ctrl-X", "Ctrl-C", (function(code) {
											return function(ed) {
												editor.removeCommand("Commit").removeCommand("Cancel"); // Remove other Commands
												nav.reload(code.script); // Force a reload to get back to a consistent state
											};
										})(code));

										// -- Go Go Commit -- //
										editor.addCommand("Commit", "Ctrl-Enter", "Ctrl-Enter", (function(code, selected) {
											return function(ed) {

												nav.busy(_id);
												editor.removeCommand("Commit").removeCommand("Cancel"); // Remove other Commands
												var __message, lines = editor.getValue().split(/\r\n|\r|\n/);
												for (var i = 0; i < lines.length; i++) {
													if (lines[i].startsWith("COMMIT MESSAGE:")) {
														__message = lines[i].substr("COMMIT MESSAGE:".length).trim();
														break;
													}
												}

												// -- Build a map of changes to be made -- //
												var _trees = [];
												var _pulls = [];
												var _total = 0;
												var _current = 0;

												// Populate change maps
												for (i = 0; i < selected.length; i++) {

													var _selection = selected[i];
													if (_selection.git.direction == "COMMIT") {

														// -- Get Tree for Repo -- //
														var _tree = _trees.find(function(tree) {
															return tree.repo.owner == _selection.git.repo.owner && tree.repo.name == _selection.git.repo.name
														});
														if (!_tree) {
															_tree = {
																repo: {
																	owner: _selection.git.repo.owner,
																	name: _selection.git.repo.name
																},
																tree: [],
															};
															_trees.push(_tree);
														}

														// -- Add File to Tree -- //
														_tree.tree.push({
															"path": _selection.name,
															"mode": "100644",
															"type": "blob",
															"content": _selection.source,
														});
														_total += 1;

													} else if (_selection.git.direction == "CLONE") {

														// -- Get Pull for Repo -- //
														var _pull = _pulls.find(function(pull) {
															return pull.repo.owner == _selection.git.repo.owner && pull.repo.name == _selection.git.repo.name
														});
														if (!_pull) {
															_pull = {
																repo: {
																	owner: _selection.git.repo.owner,
																	name: _selection.git.repo.name
																},
																files: [],
															};
															_pulls.push(_pull);
														}

														// -- Add File to Pull -- //
														_pull.files.push(_selection);
														_total += 1;

													}

												}
												// -- Build a map of changes to be made -- //

												console.log("TREES", _trees);
												console.log("PULLS", _pulls);
												
												// Handle Completion of Everything!
												var _fn_Complete = function() {
													
													// -- Dump out Git object with all changes -- //
													code.git().source = jsyaml.safeDump(git);
													code.script.files.forEach(function(file) {
														delete file.git // Remove Git metadata from each file
													});
													
													// Save Files (e.g. .git file)
													gapi.client.request({
														path: "/upload/drive/v3/files/" + code.script.id,
														method: "PATCH",
														params: {
															uploadType: "media"
														},
														body: JSON.stringify({
															files: code.script.files
														}),
													}).then(function() {

														// -- Update UI -- //
														nav.busy(_id);
														selected.forEach(function(file) {
															nav.change(file.id, "status-committed", 5000);
														});
														
														// TODO: Should handle showing .git changes here??

													}, function(err) {

														if (debug) console.log("SAVING ERROR", err);
														nav.busy(_id).error(_id, err);

													});
													
												}; // End _fn_Complete
												
												// Handle Pull from a particular repo
												var _fn_Pull = function(repo, files, all, complete) {
													
													files.forEach(function(file) {
														
														repo.contents(file.name).fetch().then(function(content) {

															if (git.last && git.last[file.id] == content.sha) {

																// No change.
																if (debug) console.log("NO NEED TO CLONE", file.name);
																_current += 1;
																if (_current == _total) complete();
																
															} else {

																if (!git.last) git.last = {}
																git.last[file.id] = content.sha;

																// -- Write back to .git object -- //
																git.log.push({
																	name: "Clone",
																	when: new Date().toISOString(),
																	file: file.name,
																	sha: content.sha,
																	url: content.htmlUrl
																});

																code.script.files[code.index].source = atob(content.content);
																// TODO : Update Navigator UI / Closures with new file source, or trigger 'silent' reload on complete?
																
																_current += 1;
																if (_current == _total) complete();
																
															}

														}, function(err) {

															if (debug) console.log("GITHUB GET CONTENT ERROR", err);
															nav.busy(_id).error(_id, err);

														});
													});
													
													
												}; // End _fn_Pull
												
												// Handle Commit to a particular repo
												var _fn_Commit = function(repo, new_tree, message, all, complete) {

													repo.branches("master").fetch().then(function(branch) {

														var commit_sha = branch.commit.sha;
														var tree_sha = branch.commit.commit.tree.sha;
														repo.git.trees.create({
															"base_tree": tree_sha,
															"tree": new_tree,
														}).then(function(tree) {

															repo.git.commits.create({
																"message": message,
																"tree": tree.sha,
																"parents": [commit_sha],
															}).then(function(commit) {

																repo.git.refs("heads/master").update({
																	"sha": commit.sha,
																}).then(function(ref) {

																	// -- Write back to .git object -- //
																	if (!git.last) git.last = {};
																	for (i = 0; i < all.length; i++) {
																		for (j = 0; j < tree.tree.length; j++) {
																			if (tree.tree[j].path == all[i].name) {
																				git.last[all[i].id] = tree.tree[j].sha;
																				break;
																			}
																		}
																	}
																	git.log.push({
																		name: "Commit",
																		when: new Date().toISOString(),
																		sha: commit.sha,
																		url: commit.htmlUrl,
																		message: commit.message,
																	});
																	
																	// -- Update Current Counter & call Complete if required -- //
																	_current += new_tree.length;
																	if (_current == _total) complete();
																		
																}, function(err) { // repo.git.refs("heads/master").update
																	if (debug) console.log("GITHUB REF CREATE ERROR", err);
																	nav.busy(_id).error(_id, err);
																})

															}, function(err) { // repo.git.commits.create
																if (debug) console.log("GITHUB COMMIT CREATE ERROR", err);
																nav.busy(_id).error(_id, err);
															});

														}, function(err) { // repo.git.trees.create
															if (debug) console.log("GITHUB TREE CREATE ERROR", err);
															nav.busy(_id).error(_id, err);
														});

													}, function(err) { // repo.branches("master").fetch
														if (debug) console.log("GITHUB BRANCH ERROR", err);
														nav.busy(_id).error(_id, err);
													})

												}; // End _fn_Commit

												// -- Commit Trees -- //
												_trees.forEach(function(_tree) {
													_fn_Commit(
														octo.repos(_tree.repo.owner, _tree.repo.name),
														_tree.tree, __message, all, _fn_Complete); // Action Commit
												})
												
												// -- Pull Files -- //
												_pulls.forEach(function(_pull) {
													_fn_Pull(
														octo.repos(_pull.repo.owner, _pull.repo.name),
														_pull.files, all, _fn_Complete);
												})

											}

										})(code, selected));

									}

								});

							};
						})(code, all.filter(function(file) {
							return file.git.selected
						})));
					}

				}
				files(instructions, code, all, octo, git);
			};
		})(code, all, instructions));

		loaded("Commit to Github -- Choose Files", _display, _, _, _, _, true);

	}

	var commit = function(customise) { // -- Handle Commit Script -- //

		if (code) {

			var _id = customise ? code.script.id : code.git() ? code.file.id : code.script.id;
			nav.busy(_id, "commit");

			hello("github").login({
				force: false,
				scope: "basic, gist, repo"
			}).then(function(a) {

				force = false;

				if (debug) console.log("GITHUB LOGIN", a);

				var octo = new Octokat({
					token: a.authResponse.access_token,
					acceptHeader: "application/vnd.github.cannonball-preview+json",
				});

				if (!code.git()) { // Configure before commit

					octo.user.repos.fetch().then(function(r) {

						if (debug) console.log("GITHUB REPOS", r.items);

						// -- Load the Repositories Instructions -- //
						$.ajax({
							url: "interact/REPOSITORIES.md",
							type: "get",
							dataType: "html",
							async: true,
							success: function(result) {
								repositories(result, code, r, _, "interact/REPOSITORIES.md", false, octo); // Display Repos List
							}
						});

						nav.busy(_id);

					}, function(err) {
						if (debug) console.log("GITHUB REPO ERROR", err);
						nav.busy(_id).error(_id, err);
					});

				} else { // Just commit

					// -- Read Config File -- //
					var git = jsyaml.safeLoad(code.git().source);
					if (debug) console.log("LOADED .GIT:", git);

					if (customise) {

						// -- Load the Commit Instructions -- //
						$.ajax({
							url: "interact/FILES.md",
							type: "get",
							dataType: "html",
							async: true,
							success: function(result) {
								octo.repos(git.repo.owner, git.repo.name).contents.fetch()
									.then(function(contents) {
										contents.items.forEach(function(content) {
											var file = code.script.files.find(function(file) {
												return file.name == content.name
											});
											if (file) {
												var _sha = shash.hex("blob " + file.source.length + "\0" + file.source);
												if (content.sha != _sha) {
													if (!file.git) file.git = {};
													file.git.changed = true;
												}
											}
										});
										code.script.files.forEach(function(file) {
											var content = contents.items.find(function(c) {
												return c.name == file.name
											});
											if (!content) {
												if (!file.git) file.git = {};
												file.git.new = true;
											}
										});
										files(result, code, code.script.files.filter(
											function(f) {
												return f.name != ".git"
											}), octo, git);
										nav.busy(_id);
									}, function(err) {
										if (debug) console.log("GITHUB CONTENTS ERROR", err);
										nav.busy(_id).error(_id, err);
									});

							}
						});

					} else {

						// -- Only Continue if this file is not an exclusion -- //
						if (git.exclude.indexOf(code.file.name) < 0 && git.exclude.indexOf(code.file.id)) {

							// -- Get Exception Details (if there) -- //
							var _exception = git.exceptions ? git.exceptions.find(function(exception) {
								return exception.id == code.file.id || exception.name == code.file.name;
							}) : null;
							var _direction = _exception ? _exception.type.toUpperCase() : git.type.toUpperCase();
							var _repo_Owner = _exception ? _exception.repo.owner : git.repo.owner;
							var _repo_Name = _exception ? _exception.repo.name : git.repo.name;

							if (_direction == "CLONE") { // Run a clone (Github to us!)

								octo.repos(_repo_Owner, _repo_Name).contents(code.file.name).fetch().then(function(content) {

									if (git.last && git.last[code.file.id] == content.sha) {

										// No change.
										if (debug) console.log("NO NEED TO CLONE");
										nav.busy(_id);

									} else {

										if (!git.last) git.last = {}
										git.last[code.file.id] = content.sha;

										// -- Write back to .git object -- //
										git.log.push({
											name: "Clone",
											when: new Date().toISOString(),
											file: code.file.name,
											sha: content.sha,
											url: content.htmlUrl
										});

										code.git().source = jsyaml.safeDump(git);
										code.script.files[code.index].source = atob(content.content);
										console.log("CODE", code.script.files[code.index].source);

										gapi.client.request({
											path: "/upload/drive/v3/files/" + code.script.id,
											method: "PATCH",
											params: {
												uploadType: "media"
											},
											body: JSON.stringify({
												files: code.script.files
											}),
										}).then(function() {

											nav.busy(_id).reload(code.script);

										}, function(err) {

											if (debug) console.log("SAVING ERROR", err);
											nav.busy(_id).error(_id, err);

										});

									}

								}, function(err) {

									if (debug) console.log("GITHUB GET CONTENT ERROR", err);
									nav.busy(_id).error(_id, err);

								});

							} else if (_direction == "COMMIT") {

								var parameters = {
									content: btoa(code.file.source),
								};

								// From: http://stackoverflow.com/questions/7225313/how-does-git-compute-file-hashes
								var _sha = shash.hex("blob " + code.file.source.length + "\0" + code.file.source);

								if (!git.last || !git.last[code.file.id]) { // Creating
									parameters.message = "Creating " + code.file.name + " [" + code.file.id + "]";
								} else if (_sha != git.last[code.file.id]) { // Updating
									parameters.message = "Updating " + code.file.name + " [" + code.file.id + "]";
									parameters.sha = git.last[code.file.id];
								}

								if (parameters.message) {

									octo.repos(_repo_Owner, _repo_Name).contents(code.file.name)
										.add(parameters).then(function(info) {

												// -- Write back to .git object -- //
												if (!git.last) git.last = {}
												git.last[code.file.id] = info.content.sha;
												git.log.push({
													name: "Commit",
													when: new Date().toISOString(),
													sha: info.commit.sha,
													url: info.commit.htmlUrl,
													message: info.commit.message,
												});

												code.git().source = jsyaml.safeDump(git);

												gapi.client.request({
													path: "/upload/drive/v3/files/" + code.script.id,
													method: "PATCH",
													params: {
														uploadType: "media"
													},
													body: JSON.stringify({
														files: code.script.files
													}),
												}).then(function() {

													nav.busy(_id).change(_id, "status-committed", 5000);
													// TODO: Should really update .git object display?

												}, function(err) {

													if (debug) console.log("SAVING ERROR", err);
													nav.busy(_id).error(_id, err);

												});

											}, function(err) {

												if (debug) console.log("GITHUB COMMIT ERROR", err);
												nav.busy(_id).error(_id, err);

											}

										);

								}

							}

						} else {

							if (debug) console.log("NO NEED TO COMMIT");
							nav.busy(_id);

						}

					}

				}

			}, function(err) {
				if (debug) console.log("GITHUB LOGIN ERROR", err);
				nav.busy(_id).error(_id, err);
			})

		} else {

			// Show details of Github Repositories
			hello("github").login({
				force: false,
				scope: "basic, gist, repo"
			}).then(function(a) {

				if (debug) console.log("GITHUB LOGIN", a);

				var octo = new Octokat({
					token: a.authResponse.access_token,
					acceptHeader: "application/vnd.github.cannonball-preview+json",
				});

				octo.user.repos.fetch().then(function(r) {

					if (debug) console.log("GITHUB REPOS", r.items);

					// -- Load the Repositories Instructions -- //
					$.ajax({
						url: "interact/DETAILS.md",
						type: "get",
						dataType: "html",
						async: true,
						success: function(result) {
							repositories(result, code, r, _, "interact/DETAILS.md", true, octo); // Display Repos List
						}
					});

					nav.busy(_id);

				}, function(err) {
					if (debug) console.log("GITHUB REPO ERROR", err);
					nav.busy(_id).error(_id, err);
				});

			});

		}

	}

	var clear = function() {

		// TODO: What if there are loaded instructions?
		if (code) {

			// -- Clear Edited Code -- //
			code = undefined;

			// -- Clear Editor too -- //
			editor.clearValue();

			// -- Finally, clear path -- //
			$("#path").empty();

		}

	}

	var showDiff = function(current, other) {

		var _diff = JsDiff.diffLines(other, current, {
				newlineIsToken: true
			}),
			_diff_View = "";

		if (debug) console.log("CALCULATED DIFF", _diff);

		_diff.forEach(function(part, i, parts) {
			if (part.added || part.removed) {
				part.value.split(/\r\n|\r|\n/).forEach(function(line, j, lines) {
					if (line || j > 0) {
						_diff_View += (part.added ? "+" : "-") + line +
							(i + 1 == parts.length && j + 1 == lines.length ? "" : "\n");
					} else if (j === 0 && lines.length == 2 && lines[j + 1] === "") {} else {
						_diff_View += "\n";
					}
				})
			} else {
				_diff_View += part.value;
			}
		});

		editor.setValue(_diff_View, editor.Modes.diff, undefined).protect(); // Set it to read-only

		// -- Finally, update path -- //
		$("#path span").text($("#path span").text() + " [DIFF]");

	}

	var diff = function(github) { // -- Handle Change Differences -- //

			if (previous) {

				// -- Restore Previous Code -- //
				code = previous.code;

				// -- Display it -- //
				editor.setValue(previous.value, previous.code.mode, change).unprotect(); // Set it to read-write

				// -- Finally, update path -- //
				$("#path span").text(previous.path);

				// -- Clear Previous -- //
				previous = undefined;

			} else if (code) {

				// -- Main Variables -- //
				var _id = code.file.id;
				var _earlier = code.value;

				// -- Set the Previous (to un-diff) -- //
				previous = {
					code: code,
					value: editor.getValue(),
					path: $("#path span").text(),
				};
				code = undefined;

				if (github && previous.code.git()) {

					nav.busy(_id);

					var git = jsyaml.safeLoad(previous.code.git().source);
					if (debug) console.log("LOADED .GIT:", git);

					if (git.last[_id]) {

						hello("github").login({
							force: false,
							scope: "basic, gist, repo"
						}).then(function(a) {

							if (debug) console.log("GITHUB LOGIN", a);

							var octo = new Octokat({
								token: a.authResponse.access_token,
								acceptHeader: "application/vnd.github.cannonball-preview+json",
							});

							octo.repos(git.repo.owner, git.repo.name).contents(previous.code.file.name)
								.fetch().then(function(file) {

									// -- Display the Diff -- //
									showDiff(_earlier, atob(file.content));

									nav.busy(_id);

								}, function(err) {

									if (debug) console.log("GITHUB ERROR", err);
									nav.busy(_id).error(_id, err);

								});

						});

					}

				} else if (changed[_id]) {

					// -- Display the Diff -- //
					showDiff(changed[_id], _earlier);

				}

			}

		}
		// == Functions == //

	// -- Create and Append Editor -- //
	var _container = $(".content");
	editor = Editor().initialise($(".content").empty(), debug);
	// -- Create and Append Editor -- //

	// -- Auth Handler -- //
	var public = function() {
		// -- Load the Public Instructions -- //
		$.ajax({
			url: "PUBLIC.md",
			type: "get",
			dataType: "html",
			async: true,
			success: function(result) {
				if (result) loaded("Getting Started ...", result);
			}
		});
	}

	startAuthFlow(
		function(user, after) { // Authorised

			var authorise = $("<form />", {
					id: "authorise",
					class: "navbar-form",
					role: "form"
				})
				.appendTo($("#authorisation").empty());
			var group = $("<div />", {
				class: "form-group"
			}).appendTo(authorise);

			$("<p />", {
					id: "user",
					class: "navbar-text",
					text: "Signed in as",
				})
				.append($("<a />", {
					id: "user_details",
					class: "navbar-link username",
					text: user.getName(),
					target: "_blank",
					href: "https://security.google.com/settings/security/permissions",
					title: "To remove this app from your account (" + user.getEmail() + "), click here and follow the instructions",
				})).appendTo(group);

			$("<button />", {
				id: "logout",
				class: "btn btn-primary btn-sm",
				text: "Sign Out",
				href: "#",
				title: "Click here to log out of this site, but keep the app authorised on your account",
			}).click(function(e) {
				e.preventDefault();
				var r = signOut();
				if (r && after) after;
				return r;
			}).appendTo(authorise);

			// Anchor the Container to below the navbar
			_container.css("top", $("nav.navbar").height());

			// -- Create & Append Navigator, then Interaction -- //
			localforage.iterate(function(value, key, i) {
				changed[key] = value;
			}).then(function() {

				// -- Enable Navigator, Interaction, Load Initial Help & Instructions Document -- //
				nav = Navigator().initialise(_container, editor, status, loaded, clear, force, debug);
				Interaction().initialise(
					window, editor, nav, {
						"save": save,
						"diff": diff,
						"load": loaded,
						"remove": remove,
						"create": create,
						"commit": commit,
						"abandon": abandon,
					}, debug);

			}).catch(function(err) {
				if (debug) console.log("LOCAL_FORAGE ERROR:", err);
			});

		},
		function() { // Un-Authorised

			// Handle Post Up Session Changes to Google Drive
			// Then clear local forage of all non-committed edits
			// Need a keyboard shortcut too to display saved edits / manage them?

			$("<form />", {
					id: "authorise",
					class: "navbar-form",
					role: "form"
				})
				.append($("<button />", {
					id: "login",
					class: "btn btn-success btn-sm",
					text: "Sign In",
					href: "#",
					title: "Click here to log into this site, you will be promped to authorise the app on your account if required"
				}).click(function(e) {
					e.preventDefault();
					return signIn();
				}))
				.appendTo($("#authorisation").empty());

			// Anchor the Container to below the navbar
			_container.css("top", $("nav.navbar").height());

			$(".auth-only").hide();
			editor.changeWidth("100%");

			// -- Clear Local Changes -- //
			if (localforage) {

				localforage.clear().then(function() {
					changed = {};
					public();
				}).catch(function(err) {
					if (debug) console.log("LOCAL_FORAGE ERROR", err);
				});

			} else {

				public();

			}

			// -- Handle Github Auth -- //
			var signed_in = function(session) {
				console.log("TESTING GITHUB SESSION", session)
				var currentTime = (new Date()).getTime() / 1000;
				return session && session.access_token && session.expires > currentTime;
			};

			if (signed_in(hello("github").getAuthResponse())) {
				hello("github").logout().then(function() {
					if (debug) console.log("LOGGED OUT OF GITHUB");
				}, function(err) {
					if (debug) console.log("GITHUB SIGNOUT ERROR", err);
				});
			} else {
				if (debug) console.log("NOT SIGNED INTO GITHUB");
			}

		});
	// -- Auth Handler -- //

});