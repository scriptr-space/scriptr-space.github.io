App = function() {
	
	// -- Returns an instance of App if required -- //
  if (!(this instanceof App)) {return new App();}
	
	// -- Internal Variables -- //
	var code, previous, hash, shash, changed, saved, deleted, _;
  // -- Internal Variables -- //
	
	// -- Internal Functions -- //
	var _change = function(value) {
		if (code && code.hash != hash.hex(value)) {

			global.changes.setItem(code.file.id, value).then(function(value) {
				changed[code.file.id] = value;
				global.navigator.change(code.file.id, "status-changed");
			}).catch(function(e) {
				global.flags.error("Local Forage Set", e);
			});

		} else {

			global.changes.removeItem(code.file.id).then(function(value) {
				delete changed[code.file.id];
				global.navigator.change(code.file.id, "");
			}).catch(function(e) {
				global.flags.error("Local Forage Remove", e);
			});

		}
	}
	// -- Internal Functions -- //
	
	// -- External Visibility -- //
  return {

    // -- External Functions -- //
		
    initialise : function(loaded) {
			
			// -- Set Up Scoped Variables -- //
			hash = new Hashes.MD5();
			shash = new Hashes.SHA1();
			changed = loaded ? loaded : {};
			saved = {};
			deleted = {};
			
			// -- Return for Chaining -- //
			return this;
			
    },

		status : function(id) { // -- Handle Changes to Edited Document -- //
			if (id in saved) {
				return "status-saved";
			} else if (id in changed) {
				return "status-changed";
			} else {
				return "";
			}
		},

		force : function(file) {
			if (file) {
				global.changes.setItem(file.id, file.source).then(function(value) {
					changed[file.id] = value;
					global.navigator.change(file.id, "status-changed");
				}).catch(function(e) {
					global.flags.error("Local Forage Set", e);
				});
			}
		},

		change : function(value) { // -- Handle Changes to Edited Document -- //

			_change(value);

		},

		loaded : function(name, value, script, file, files, index, interaction, editable, row, col) { // -- Handles a loaded file/script -- //

			$("#path").empty().append($("<span />", {text: name}));
	
			previous = undefined;

			if (interaction) {

				if (editable) {
					// Set it to read-write
					global.editor.setValue(value, global.editor.Modes.interact, undefined).unprotect().focus();
				} else {
					// Set it to read-only
					global.editor.setValue(value, global.editor.Modes.interact, undefined).protect().focus();
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
					code.mode = global.editor.Modes.yaml;
				} else if (file.name.endsWith(".js")) {
					code.mode = global.editor.Modes.gas_html_js; // Need to ignore open/close script tags
				} else if (file.name.endsWith(".css")) {
					code.mode = global.editor.Modes.gas_html_css // Need to ignore open/close style tags
				} else {
					code.mode = file.type == "html" ? global.editor.Modes.html : file.type == "server_js" ?
						global.editor.Modes.gas : global.editor.Modes.text;
				}
				code.script.files = files.filter(
					function(file) {
						return !(file.id in deleted);
					}
				);

				value = file.id in changed &&
					hash.hex(changed[file.id]) != hash.hex(value) ? changed[file.id] : value;

				global.editor.setValue(value, code.mode, _change).unprotect().focus(); // Set it to read-write

			} else {

				code = undefined;
				global.editor.setValue(value, global.editor.Modes.markdown, undefined).protect().focus(); // Set it to read-only

			}

			global.editor.setPosition(row ? row : 0, col ? col : 0);

		},

		create : function(html_type) { // -- Handle Create File in Script -- //

			if (code) {

				global.navigator.busy(code.script.id, "create");

				code.script.files.push({
					name: "Code_" + uuid.v4().substr(32),
					source: "var foo = function(bar) {};",
					type: html_type ? "html" : "server_js",
				});

				global.google.save(code.script.id, code.script.files).then(function() {

					global.navigator.busy(code.script.id).reload(code.script, code.script.files[code.script.files.length - 1].name);

				}, function(e) {

					global.flags.error("Google Drive Save", e);
					global.navigator.busy(code.script.id).error(code.script.id, e);

				});

			}

		},

		remove : function() { // -- Handle Remove File in Script -- //

			if (code && code.file) {

				if (global.navigator.is(code.file.id, "status-condemned")) {

					global.navigator.change(code.file.id).busy(code.file.id, "delete");

					code.script.files = code.script.files.filter(
						function(file) {
							return file.id !== code.file.id;
						}
					);

					global.google.save(code.script.id, code.script.files).then(function() {

						global.changes.removeItem(code.file.id).then(function() {

							delete changed[code.file.id];
							deleted[code.file.id] = true;
							global.navigator.busy(code.file.id).change(code.file.id, "status-deleted", 4000, true).select(code.script, code.index);

						}).catch(function(e) {
							global.flags.error("Local Forage Remove", e);
							global.navigator.busy(code.file.id).error(code.file.id, e);
						});

					}, function(e) {

						global.flags.error("Google Drive Delete File in Script", e);
						global.navigator.busy(code.file.id).error(code.file.id, e);

					});

				} else {

					global.navigator.change(code.file.id, "status-condemned", 2000);

				}
			}
		},

		abandon : function() { // -- Handle Abandon Local Changes to a File in Script -- //

			if (code && code.file && changed[code.file.id]) {

				if (global.navigator.is(code.file.id, "status-imperilled")) {

					global.changes.removeItem(code.file.id).then(function() {
						delete changed[code.file.id];
						global.navigator.change(code.file.id, "status-abandoned", 2000);
						global.editor.setValue(code.file.source, code.mode, _change).unprotect();
					}).catch(function(e) {
						global.flags.error("Local Forage Remove", e);
						global.navigator.error(code.file.id, e);
					});

				} else {

					global.navigator.change(code.file.id, "status-imperilled", 2000);

				}
			}
		},

		save : function(all) { // -- Handle Save Script -- //

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

					if (code) global.navigator.busy(all ? code.script.id : code.file.id, "save");

					global.google.save(code.script.id, code.script.files).then(function() {

						Object.keys(saving).forEach(function(id) {
							global.changes.removeItem(id).then(function() {
								delete changed[id];
								global.navigator.change(id, "status-saved", 5000);
							}).catch(function(e) {
								global.flags.error("Local Forage Remove", e);
							});
						});

						global.navigator.busy(all ? code.script.id : code.file.id);

					}, function(e) {

						// -- Roll back changes -- //
						code.script.files.forEach(function(file) {
							if (saving[file.id]) file.source = saving[file.id];
						});
						
						global.flags.error("Google Drive Save", e);
						global.navigator.busy(all ? code.script.id : code.file.id)
							.error(all ? code.script.id : code.file.id, e);

					});

				}

			}

		},

		repository : function(repo, meta) {

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
		},

		repositories : function(instructions, code, list, selected, file_Name, display_Details) {

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
				global.editor.addCommand("Select Repo", "Space", "Space", (function(code, repos) {
					return function(ed) {

						if (repos) {

							var selected_Row = ed.selection.lead.row,
								_selected_Repo;
							if (meta.lines["Line_" + selected_Row]) {
								global.flags.log("Selected Repo", meta.lines["Line_" + selected_Row]);
								for (var i = 0; i < repos.length; i++) {

									if (repos[i].fullName == meta.lines["Line_" + selected_Row] && repos[i].permissions.push) {

										repos[i].selected = true;
										_selected_Repo = repos[i];

										if (display_Details) { // Next stage is to show repo info

											global.editor.addCommand("Show Repo", "Ctrl-Enter", "Ctrl-Enter", (function(repo, code) {
												return function(ed) {
													if (repo) {
														
														global.flags.log("Display Repo", repo);
														global.editor.removeCommand("Select Repo").removeCommand("Show Repo");

														$.ajax({url: "interact/REPOSITORY.md", dataType: "text"}).done(function(result) {
																repo.branches.fetch().then(function(branches) {
																	var _branch_Count = branches.items.length;
																	var _branches = [];
																	var _continue = function() {
																		global.app.loaded("Repository Details", result.replace(new RegExp(
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
																					global.flags.log("Completed Branch", _branch);
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
																									global.flags.log("Completed Branch", _branch);
																									if (_branches.length == _branch_Count) _continue();
																								}
																							}, function(err) {
																								file_Count += 1;
																								if (file_Count == file_Total) {
																									_branches.push(_branch);
																									global.flags.log("Completed Branch", _branch);
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
															});

													}
												};

											})(_selected_Repo, code));

										} else { // Next stage is to write .git

											global.editor.addCommand("Configure Repo", "Ctrl-Enter", "Ctrl-Enter", (function(repo, code) {
												return function(ed) {
													if (repo) {
														global.flags.log("Confirmed Repo", repo);
														global.editor.removeCommand("Select Repo").removeCommand("Configure Repo");

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
														code.script.files.push({name: ".git", source: jsyaml.safeDump(git), 
																										type: "html"});

														global.google.save(code.script.id, code.script.files).then(function() {

															global.navigator.reload(code.script);

														}, function(e) {

															global.flags.error("Google Drive Save", e);

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
								$.ajax({url: file_Name, dataType: "text"}).done(function(result) {
									// Display Repos List
									repositories(result, code, repos, _selected_Repo, file_Name, display_Details);
								});

							}
						}
					};
				})(code, all_Repos));

				global.app.loaded("Select Target Repo", meta.instructions.replace(new RegExp(RegExp.escape("{{REPOSITORIES}}"), "g"),
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
				list.forEach(function(repo) {
					meta = repository(repo, meta);
					all_Repos.push(repo);
				});

				_continue();

			}

		},

		files : function(instructions, code, all, git) {

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

			global.editor.addCommand("Select Files", "Space", "Space", (function(code, all, instructions) {
				return function(ed) {

					var _file = meta.lines["Line_" + ed.selection.lead.row];

					if (_file) {

						var _selected = all.find(function(file) {
							return file.name == _file
						});
						if (_selected && (_selected.git.changed || _selected.git.new)) {

							global.flags.log("Selected File", _selected);
							_selected.git.selected = !_selected.git.selected; // Reverse Selection

							// -- Cancel Commit -- //
							global.editor.addCommand("Commit", "Ctrl-X", "Ctrl-C", (function(code) {
								return function(ed) {
									global.editor.removeCommand("Select Files").removeCommand("Review").removeCommand("Cancel"); // Remove other Commands
									global.navigator.reload(code.script);
								};
							})(code));
							// -- Cancel Commit -- //

							// -- Review Commit -- //
							global.editor.addCommand("Review", "Ctrl-Enter", "Ctrl-Enter", (function(code, selected) {
								return function(ed) {
									global.editor.removeCommand("Select Files").removeCommand("Review").removeCommand("Cancel"); // Remove other Commands

									$.ajax({url: "interact/REVIEW.md", dataType: "text"}).done(function(result) {

											var _list = "",
												_message = "Add/Update -";
											selected.forEach(function(file) {
												_list += ("\n*\t" + file.name + (file.git.direction == "CLONE" ? "  ⇦" : "  ➡"));
												_message += (" " + file.name);
											});
											result = result
												.replace(new RegExp(RegExp.escape("{{MESSAGE}}"), "g"), _message)
												.replace(new RegExp(RegExp.escape("{{FILES}}"), "g"), _list);

											global.app.loaded("Commit to Github -- Review", result, _, _, _, _, true, true);

											// -- Cancel Commit -- //
											global.editor.addCommand("Cancel", "Ctrl-X", "Ctrl-C", (function(code) {
												return function(ed) {
													global.editor.removeCommand("Commit").removeCommand("Cancel"); // Remove other Commands
													global.navigator.reload(code.script); // Force a reload to get back to a consistent state
												};
											})(code));

											// -- Go Go Commit -- //
											global.editor.addCommand("Commit", "Ctrl-Enter", "Ctrl-Enter", (function(code, selected) {
												return function(ed) {

													global.navigator.busy(_id);
													global.editor.removeCommand("Commit").removeCommand("Cancel"); // Remove other Commands
													var __message, lines = global.editor.getValue().split(/\r\n|\r|\n/);
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

													global.flags.log("Trees", _trees);
													global.flags.log("Pulls", _pulls);

													// Handle Completion of Everything!
													var _fn_Complete = function() {

														// -- Dump out Git object with all changes -- //
														code.git().source = jsyaml.safeDump(git);
														code.script.files.forEach(function(file) {
															delete file.git // Remove Git metadata from each file
														});

														// Save Files (e.g. .git file)
														global.google.save(code.script.id, code.script.files).then(function() {

															// -- Update UI -- //
															global.navigator.busy(_id);
															selected.forEach(function(file) {
																global.navigator.change(file.id, "status-committed", 5000);
															});

															// TODO: Should handle showing .git changes here??

														}, function(e) {

															global.flags.error("Google Drive Saving", e);
															global.navigator.busy(_id).error(_id, e);

														});

													}; // End _fn_Complete

													// Handle Pull from a particular repo
													var _fn_Pull = function(repo_owner, repo_name, files, all, complete) {

														files.forEach(function(file) {

															global.github.file(repo_owner, repo_name, file.name).then(function(content) {

																if (git.last && git.last[file.id] == content.sha) {

																	// No change.
																	global.flags.log("No Need to Clone", file.name);
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

															}, function(e) {

																global.flags.error("Github Get Content", e);
																global.navigator.busy(_id).error(_id, e);

															});
														});


													}; // End _fn_Pull

													// Handle Commit to a particular repo
													var _fn_Commit = function(repo_owner, repo_name, new_tree, message, all, complete) {
														global.github.branch(repo_owner, repo_name, "master").then(function(branch) {

															var commit_sha = branch.commit.sha;
															var tree_sha = branch.commit.commit.tree.sha;
															
															global.github.create_Tree(repo_owner, repo_name, 
																							tree_sha, new_tree).then(function(tree) {

																global.github.create_Commit(repo_owner, repo_name, message, 
																							tree.sha, commit_sha).then(function(commit) {

																	global.github.update_Reference(repo_owner, repo_name, 
																							 "heads/master", commit.sha).then(function(ref) {

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
																			name: "Commit", when: new Date().toISOString(),
																			sha: commit.sha, url: commit.htmlUrl, message: commit.message,
																		});

																		// -- Update Current Counter & call Complete if required -- //
																		_current += new_tree.length;
																		if (_current == _total) complete();

																	}, function(e) { // repo.git.refs("heads/master").update
																		global.flags.error("Github Ref Create", e);
																		global.navigator.busy(_id).error(_id, e);
																	})

																}, function(e) { // repo.git.commits.create
																	global.flags.error("Github Commit Create", e);
																	global.navigator.busy(_id).error(_id, e);
																});

															}, function(e) { // repo.git.trees.create
																global.flags.error("Github Tree Create", e);
																global.navigator.busy(_id).error(_id, e);
															});

														}, function(e) { // repo.branches("master").
															global.flags.error("Github Branch Fetch", e);
															global.navigator.busy(_id).error(_id, e);
														})

													}; // End _fn_Commit

													// -- Commit Trees -- //
													_trees.forEach(function(_tree) {
														_fn_Commit(
															_tree.repo.owner, _tree.repo.name,
															_tree.tree, __message, all, _fn_Complete); // Action Commit
													})

													// -- Pull Files -- //
													_pulls.forEach(function(_pull) {
														_fn_Pull(
															_pull.repo.owner, _pull.repo.name,
															_pull.files, all, _fn_Complete);
													})

												}

											})(code, selected));

										});

								};
							})(code, all.filter(function(file) {
								return file.git.selected
							})));
						}

					}
					global.app.files(instructions, code, all, git);
				};
			})(code, all, instructions));

			global.app.loaded("Commit to Github -- Choose Files", _display, _, _, _, _, true);

		},

		commit : function(customise) { // -- Handle Commit Script -- //

			if (code) {

				var _id = customise ? code.script.id : code.git() ? code.file.id : code.script.id;
				global.navigator.busy(_id, "commit");

				hello.login("github", {force: false, scope: 
				  encodeURIComponent(GITHUB_SCOPES.join(" "))}).then(function(a) {

					force = false;
					global.flags.log("Signed into Github", a);

					if (!code.git()) { // Configure before commit

						global.github.repos().then(function(repos) {

							global.flags.log("Github Repos", repos);
							
							// -- Load the Repositories Instructions -- //
							$.ajax({url: "interact/REPOSITORIES.md", dataType: "text"}).done(function(result) {
								repositories(result, code, repos, _, "interact/REPOSITORIES.md", false);
							});

							global.navigator.busy(_id);

						}, function(e) {
							
							global.flags.error("Github Repos Fetch", e);
							global.navigator.busy(_id).error(_id, e);
							
						});

					} else { // Just commit

						// -- Read Config File -- //
						var git = jsyaml.safeLoad(code.git().source);
						console.log(git);
						global.flags.log("Loaded .git", git);
						
						if (customise) {

							// -- Load the Commit Instructions -- //
							$.ajax({url: "interact/FILES.md", dataType: "text"}).done(function(result) {
								
								global.github.contents(git.repo.owner, git.repo.name).then(function(contents) {
									contents.forEach(function(content) {
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
												var content = contents.find(function(c) {
													return c.name == file.name
												});
												if (!content) {
													if (!file.git) file.git = {};
													file.git.new = true;
												}
											});
											global.app.files(result, code, code.script.files.filter(
												function(f) {
													return f.name != ".git"
												}), git);
											global.navigator.busy(_id);
										}, function(e) {
											global.flags.error("Github Contents Fetch", e);
											global.navigator.busy(_id).error(_id, e);
										});

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

									global.github.file(_repo_Owner, _repo_Name, 
									 	code.file.name).then(function(content) {

										if (git.last && git.last[code.file.id] == content.sha) {

											// No change.
											global.flags.log("No Need to Clone", code.file.name);
											global.navigator.busy(_id);

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
											
											global.flags.log("Code", code.script.files[code.index].source);

											global.google.save(code.script.id, code.script.files).then(function() {

												global.navigator.busy(_id).reload(code.script);

											}, function(e) {

												global.flags.log("Google Drive Save", e);
												global.navigator.busy(_id).error(_id, e);

											});

										}

									}, function(e) {

										global.flags.error("Github Get Content", e);
										global.navigator.busy(_id).error(_id, e);

									});

								} else if (_direction == "COMMIT") {

									var _updateFile = function(info) {
										
										// -- Write back to .git object -- //
										if (!git.last) git.last = {}
										git.last[code.file.id] = info.content.sha;
										git.log.push({
											name: "Commit",
											when: new Date().toISOString(),
											sha: info.commit.sha,
											url: info.commit.html_url,
											message: info.commit.message,
										});

										code.git().source = jsyaml.safeDump(git);

										global.google.save(code.script.id, code.script.files).then(function() {

											global.navigator.busy(_id).change(_id, "status-committed", 5000);
											// TODO: Should really update .git object display?

										}, function(e) {

											global.flags.error("Google Drive Save", e);
											global.navigator.busy(_id).error(_id, e);

										});
										
									}
									
									var parameters = {content: btoa(code.file.source)};

									// From: http://stackoverflow.com/questions/7225313/how-does-git-compute-file-hashes
									var _sha = shash.hex("blob " + code.file.source.length + "\0" + code.file.source);
									
									if (!git.last || !git.last[code.file.id]) { // Creating
										
										global.github.add_File(_repo_Owner, _repo_Name, code.file.name,
											"Creating " + code.file.name + " [" + code.file.id + "]", code.file.source
											).then(_updateFile);
										
									} else if (_sha != git.last[code.file.id]) { // Updating
										
										global.github.update_File(_repo_Owner, _repo_Name, code.file.name,
											"Updating " + code.file.name + " [" + code.file.id + "]", code.file.source,
											git.last[code.file.id]).then(_updateFile);
										
									}

								}

							} else {

								global.flags.log("File Excluded", code.file.name);
								global.navigator.busy(_id);

							}

						}

					}

				}, function(e) {
					global.flags.error("Signed into Github", e);
					global.navigator.busy(_id).error(_id, e);
				})

			} else {

				// Show details of Github Repositories
				hello.login("github", {force: false, 
				  scope : encodeURIComponent(GITHUB_SCOPES.join(" "))}).then(function(a) {

					global.flags.log("Signed into Github", a);
			
					global.github.repos().then(function(repositories) {
						
						global.flags.log("Github Repos", repositories);
						
						// -- Load the Repositories Instructions -- //
						$.ajax({url: "interact/DETAILS.md", dataType: "text"}).done(function(result) {
							global.app.repositories(result, code, repositories, _, "interact/DETAILS.md", true); 
					  }).fail(function(e) {
							global.flags.error("Github Repos Fetch", e);
						}).always(function() {
							global.navigator.busy(_id);
						});
					
					});
					
				}, function(e) {
					global.flags.error("Signed into Github", e);
				});

			}

		},

		clear : function() {

			// TODO: What if there are loaded instructions?
			if (code) {

				// -- Clear Edited Code -- //
				code = undefined;

				// -- Clear Editor too -- //
				global.editor.clearValue();

				// -- Finally, clear path -- //
				$("#path").empty();

			}

		},

		showDiff : function(current, other) {

			var _diff = JsDiff.diffLines(other, current, {newlineIsToken: true}), _view = "";

			global.flags.log("Calculated Diff", _diff);

			_diff.forEach(function(part, i, parts) {
				if (part.added || part.removed) {
					part.value.split(/\r\n|\r|\n/).forEach(function(line, j, lines) {
						if (line || j > 0) {
							_view += (part.added ? "+" : "-") + line +
								(i + 1 == parts.length && j + 1 == lines.length ? "" : "\n");
						} else if (j === 0 && lines.length == 2 && lines[j + 1] === "") {} else {
							_view += "\n";
						}
					})
				} else {
					_view += part.value;
				}
			});

			global.editor.setValue(_view, global.editor.Modes.diff, undefined).protect(); // Set it to read-only

			// -- Finally, update path -- //
			$("#path span").text($("#path span").text() + " [DIFF]");

		},

		diff : function(github) { // -- Handle Change Differences -- //

			if (previous) {

				// -- Restore Previous Code -- //
				code = previous.code;

				// -- Display it -- //
				global.editor.setValue(previous.value, previous.code.mode, _change).unprotect(); // Set it to read-write

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
					value: global.editor.getValue(),
					path: $("#path span").text(),
				};
				code = undefined;

				if (github && previous.code.git()) {

					global.navigator.busy(_id);

					var git = jsyaml.safeLoad(previous.code.git().source);
					global.flags.log("Loaded .git", git);

					if (git.last[_id]) {

						hello.login("github", {force: false, scope: 
						 encodeURIComponent(GITHUB_SCOPES.join(" "))}).then(function(a) {

							global.flags.log("Github Login", a);
							
							global.github.file(git.repo.owner, git.repo.name, previous.code.file.name)
							.then(function(file) {
								global.app.showDiff(_earlier, atob(file.content)); // -- Display the Diff
								global.navigator.busy(_id);
							}).catch(function(e) {
								global.flags.error("Github Contents Get", e);
								global.navigator.busy(_id).error(_id, e);
							});

						});

					} else {
						
						//global.navigator.busy(_id);
					
					}

				} else if (changed[_id]) {

					// -- Display the Diff -- //
					global.app.showDiff(changed[_id], _earlier);

				}

			}

		},
		// == Functions == //
		
	}
}