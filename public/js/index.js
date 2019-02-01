let userId;
let gameId;
let collectionLength = 0;
// Prompt the user for their username upon page load.
$(document).ready(function() {
    // Initialize Materialize modal
    // $('.modal').modal();
    usernameSelect();
    gameSearch();
    $('#searchResults').hide();
    $('#collectionName').hide();
});

// On clicking the Submit button, this will run the API route for user login/creation.  Returned object will be used to populate #username, as well as store the userId global variable for later use.
function usernameSelect() {
    $('#usernameText').keypress(function(event){
        if (event.which == 13 && userId == null) {
            // Pull username string out of text input
            let userCheck = $('#usernameText').val().trim();
            // Hit API and run the route for user login/creation
            $.ajax('/api/user/'+userCheck)
                // What to do with promise
                .then(
                    function(result) {
                        console.log("Result of usernameSelect():");
                        // Sequelize's .findOrCreate() method returns results in an array, so we must select the first index value to get actual user data.
                        console.log(result[0]);
                        // Map the primary key id value of the returned user to the global userId variable, for later queries.
                        userId = result[0].id;
                        console.log("userId is "+userId);
                        // Display the returned username in the appropriate div element.
                        let usernameDiv = $('.username');
                        usernameDiv.append(result[0].username);
                        $('#collectionName').show();
                        showCollection();
                    }
                );
            }
        });
}

// Upon pressing the enter key in the search box, query the Giant Bomb API using the game name specified by the user in the search box.  We'll use the query results to build the table of search results.
function gameSearch() {
    // Keypress event targeted to the search box
    $('#search').keypress(function(event){
        // Checks to ensure Enter keypress
        if(event.which == 13) {
            $('#searchResultsTable').empty();
            // Check to see if user is logged in
            if (userId != null) {
            // Map the text written in search box to variable gameTitle
            let gameTitle = $('#search').val().trim();
            // Run AJAX query against API route for search then perform some logic with the response.
            $.ajax('/api/search/'+gameTitle).then(function(response){
                $('#searchResults').show();
                // Big block of table construction using jQuery!  This will create a table displaying the results of the search query, with buttons to add a game to your collection.
                let resultsTableDiv = $('#searchResultsTable');
                let resultsTableMain = $('<table>');
                resultsTableMain.addClass('highlight centered responsive-table');
                let resultsTableBody = $('<tbody>');
                resultsTableDiv.append(resultsTableMain);
                resultsTableMain.append(resultsTableBody);
                for (let i = 0; i < response.results.length; i++) {
                    let currentResults = response.results[i];
                    let resultsTableRow = $('<tr>');
                    resultsTableBody.append(resultsTableRow);
                    let resultsTableBoxartDisplay = $('<td>');
                    let resultsTableBoxart = $('<img>');
                    resultsTableBoxart.attr('src', currentResults.image.icon_url);
                    resultsTableBoxart.attr("data-boxart"+i, currentResults.image.icon_url);
                    resultsTableBoxartDisplay.append(resultsTableBoxart);
                    resultsTableRow.append(resultsTableBoxartDisplay);
                    let resultsTableNameDisplay = $('<td>');
                    let resultsTableName = currentResults.name;
                    // Store the Title of the game for use in collection add
                    resultsTableNameDisplay.attr("data-name"+i, currentResults.name);
                    resultsTableNameDisplay.attr("id", "gameNameResult"+i);
                    resultsTableNameDisplay.append(resultsTableName);
                    resultsTableRow.append(resultsTableNameDisplay);
                    let resultsTablePlatformsDisplay = $('<td>');
                    let currentResultsPlatformLength;
                    // Check to see if any platforms are returned by the Giant Bomb API.  If not, this value is null, which breaks our for loop below.  I assign a value of 0 to ensure the table generator doesn't break.
                    if (currentResults.platforms === null) {
                        currentResultsPlatformLength = 0;
                    } else {
                        currentResultsPlatformLength = currentResults.platforms.length;
                    };
                    console.log("Result "+i+" platforms.length is "+currentResultsPlatformLength);
                    // Loop through the platforms result to display them in the table.
                    for (let j = 0; j < currentResultsPlatformLength; j++) {
                        let platformLoop = currentResults.platforms[j].abbreviation;
                        resultsTablePlatformsDisplay.append(platformLoop);
                        resultsTablePlatformsDisplay.attr("data-platforms"+i+j, platformLoop);
                        // This is to ensure we don't end up with an extra / on the end of our list of displayed platforms, and puts spacing in between the platforms listed by our loop.
                        if (j < (currentResults.platforms.length - 1)) {
                            resultsTablePlatformsDisplay.append(" / ");
                        }
                    }
                    resultsTableRow.append(resultsTablePlatformsDisplay);
                    let resultsTableButtonDisplay = $('<td>');
                    let resultsTableButton = $('<a>');
                    resultsTableButton.addClass("btn-floating btn-small waves-effect waves-light grey darken-1 addToCollection");
                    resultsTableButton.attr("data-guid", currentResults.guid);
                    resultsTableButton.attr("data-resultId", i);
                    let resultsTableButtonIcon = $('<i>');
                    resultsTableButtonIcon.addClass("material-icons")
                    resultsTableButtonIcon.append("save")
                    resultsTableButton.append(resultsTableButtonIcon);
                    resultsTableButtonDisplay.append(resultsTableButton);
                    resultsTableRow.append(resultsTableButtonDisplay);
                }
                addToCollection();
            });
            }
        }
    });
}

// Function to add a game from search results to your collection.
function addToCollection() {
    $(".addToCollection").on("click", function() {
        let resultId = $(this).attr("data-resultId");
        let titleId = "#gameNameResult"+resultId;
        let dataId = "data-name"+resultId;
        let title = $(titleId).attr(dataId);
        let guid = $(this).attr("data-guid");
        // Query our API to check to see if the game already exists.  If it doesn't, create it in our games table, then add it to collection.  If it does, just add to collection.
        $.ajax('/api/game/'+title+'/'+guid)
            .then(function(response) {
                console.log(response);
                let gameId = response[0].id
                console.log("Ajax query to local API complete.  gameId is: "+gameId);
                $.ajax('/api/collection/'+userId+'/add/'+gameId)
                    .then(function(collection) {
                        console.log("Add to collection response is:");
                        console.log(collection);
                        $("#searchResultsTable").empty();
                        collectionLength++;
                        $.ajax('/api/gamelookup/'+guid)
                            .then(function(response) {
                                let currentResults = response.results;
                                let resultsTableRow = $('<tr>');
                                resultsTableRow.attr('id', "collectionRow"+collectionLength);
                                $('#collectionTable').append(resultsTableRow);
                                let resultsTableBoxartDisplay = $('<td>');
                                let resultsTableBoxart = $('<img>');
                                resultsTableBoxart.attr('src', currentResults.image.icon_url);
                                resultsTableBoxart.attr("data-boxart"+collectionLength, currentResults.image.icon_url);
                                resultsTableBoxartDisplay.append(resultsTableBoxart);
                                resultsTableRow.append(resultsTableBoxartDisplay);
                                let resultsTableNameDisplay = $('<td>');
                                let resultsTableName = currentResults.name;
                                // Store the Title of the game for use in collection add
                                resultsTableNameDisplay.attr("data-name"+collectionLength, currentResults.name);
                                resultsTableNameDisplay.attr("id", "collectionGameNameResult"+collectionLength);
                                resultsTableNameDisplay.append(resultsTableName);
                                resultsTableRow.append(resultsTableNameDisplay);
                                let resultsTablePlatformsDisplay = $('<td>');
                                let currentResultsPlatformLength;
                                if (currentResults.platforms === null) {
                                    currentResultsPlatformLength = 0;
                                } else {
                                    currentResultsPlatformLength = currentResults.platforms.length;
                                };
                                console.log("Result "+collectionLength+" platforms.length is "+currentResultsPlatformLength);
                                for (let j = 0; j < currentResultsPlatformLength; j++) {
                                    let platformLoop = currentResults.platforms[j].abbreviation;
                                    resultsTablePlatformsDisplay.append(platformLoop);
                                    resultsTablePlatformsDisplay.attr("data-platforms"+collectionLength+j, platformLoop);
                                    if (j < (currentResults.platforms.length - 1)) {
                                        resultsTablePlatformsDisplay.append(" / ");
                                    }
                                }
                                resultsTableRow.append(resultsTablePlatformsDisplay);
                                let resultsTableButtonDisplay = $('<td>');
                                let resultsTableButton = $('<a>');
                                resultsTableButton.addClass("btn-floating btn-small waves-effect waves-light grey darken-1 removeFromCollection");
                                resultsTableButton.attr("data-guid", currentResults.guid);
                                resultsTableButton.attr("data-resultId", collectionLength);
                                console.log("Internal DB Game id is "+collection.id);
                                resultsTableButton.attr("data-gameId", collection.id);
                                let resultsTableButtonIcon = $('<i>');
                                resultsTableButtonIcon.addClass("material-icons")
                                resultsTableButtonIcon.append("delete_forever")
                                resultsTableButton.append(resultsTableButtonIcon);
                                resultsTableButtonDisplay.append(resultsTableButton);
                                resultsTableRow.append(resultsTableButtonDisplay);
                                $('html, body').animate({
                                    scrollTop: $("#collectionRow"+collectionLength).offset().top
                                }, 1000);
                            });
                    });
            });
    });
}

function showCollection() {
    $.ajax('/api/collection/'+userId).then(function(collection) {
        // Big block of table construction using jQuery!  This will create a table displaying the user's collection, with buttons to remove a game from your collection.
        let resultsTableDiv = $('#collection');
        let resultsTableMain = $('<table>');
        resultsTableMain.addClass('highlight centered responsive-table');
        let resultsTableBody = $('<tbody>');
        resultsTableBody.attr('id', 'collectionTable');
        resultsTableDiv.append(resultsTableMain);
        resultsTableMain.append(resultsTableBody);
        console.log("collection object result is ");
        console.log(collection);
        console.log("---------------");
        collectionLength = collection.collection.length;
        for (let i = 0; i < collection.collection.length; i++) {
            console.log("Guid extracted from collection object is: "+collection.collection[i].guid);
            $.ajax('/api/gamelookup/'+collection.collection[i].guid)
                .then(function(response) {
                    console.log(response);
                    let currentResults = response.results;
                    let resultsTableRow = $('<tr>');
                    resultsTableRow.attr('id', "collectionRow"+i);
                    resultsTableBody.append(resultsTableRow);
                    let resultsTableBoxartDisplay = $('<td>');
                    let resultsTableBoxart = $('<img>');
                    resultsTableBoxart.attr('src', currentResults.image.icon_url);
                    resultsTableBoxart.attr("data-boxart"+i, currentResults.image.icon_url);
                    resultsTableBoxartDisplay.append(resultsTableBoxart);
                    resultsTableRow.append(resultsTableBoxartDisplay);
                    let resultsTableNameDisplay = $('<td>');
                    let resultsTableName = currentResults.name;
                    // Store the Title of the game for use in collection add
                    resultsTableNameDisplay.attr("data-name"+i, currentResults.name);
                    resultsTableNameDisplay.attr("id", "collectionGameNameResult"+i);
                    resultsTableNameDisplay.append(resultsTableName);
                    resultsTableRow.append(resultsTableNameDisplay);
                    let resultsTablePlatformsDisplay = $('<td>');
                    let currentResultsPlatformLength;
                    if (currentResults.platforms === null) {
                        currentResultsPlatformLength = 0;
                    } else {
                        currentResultsPlatformLength = currentResults.platforms.length;
                    };
                    console.log("Result "+i+" platforms.length is "+currentResultsPlatformLength);
                    for (let j = 0; j < currentResultsPlatformLength; j++) {
                        let platformLoop = currentResults.platforms[j].abbreviation;
                        resultsTablePlatformsDisplay.append(platformLoop);
                        resultsTablePlatformsDisplay.attr("data-platforms"+i+j, platformLoop);
                        if (j < (currentResults.platforms.length - 1)) {
                            resultsTablePlatformsDisplay.append(" / ");
                        }
                    }
                    resultsTableRow.append(resultsTablePlatformsDisplay);
                    let resultsTableButtonDisplay = $('<td>');
                    let resultsTableButton = $('<a>');
                    resultsTableButton.addClass("btn-floating btn-small waves-effect waves-light grey darken-1 removeFromCollection");
                    resultsTableButton.attr("data-guid", currentResults.guid);
                    resultsTableButton.attr("data-resultId", i);
                    console.log("Internal DB Game id is "+collection.collection[i].id);
                    resultsTableButton.attr("data-gameId", collection.collection[i].id);
                    let resultsTableButtonIcon = $('<i>');
                    resultsTableButtonIcon.addClass("material-icons")
                    resultsTableButtonIcon.append("delete_forever")
                    resultsTableButton.append(resultsTableButtonIcon);
                    resultsTableButtonDisplay.append(resultsTableButton);
                    resultsTableRow.append(resultsTableButtonDisplay);
                });
        };
        removeFromCollection();
    });
};

// Removes the association between a user and a game from the 'usergame' join table upon clicking the 'remove from collection' button.  Also utilizes jQuery to clear the row from the collection table in real time.
function removeFromCollection() {
    // Use a delegated selector for the 'remove from collection' button, since these elements do not exist on page load initially.
    $("#collection").on("click", ".removeFromCollection", function() {
        event.preventDefault();
        console.log("----------------");
        console.log("Fired off collection removal event.")
        let gameId = $(this).attr("data-gameId");
        console.log("Game ID is "+gameId);
        console.log("User ID is "+userId);
        // Removes the table row for the game being removed from collection.
        $(this).parents("tr").remove();
        // Backend API call to remove the association from the 'usergame' join table.
        $.ajax('/api/collection/'+userId+'/remove/'+gameId)
            .then(function(response){
                console.log("Response to ajax query is:");
                console.log(response);
                if (response == 1){
                    console.log('Item removed from collection!');
                } else {
                    console.log('Failed to remove item from collection.');
                }
            });
    });
};

// Notes:  The "table generation" code has been utilized three times in this app, each with very slight variations in attribute names being assigned and other tiny differences.  This could probably be cleaned up into a single function to make this code more readable/follow DRY, but we ran out of time before project was due.  You will also notice a number of data attributes assigned to different elements that we do not currently utilize in our code - these were added to facilitate future planned functionality of the app.