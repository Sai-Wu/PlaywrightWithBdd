@Amazon
Feature: Testing Amazon UI
    Scenario Outline: Testing the login functionality
        Given I navigate to the homepage
        When I navigate to the login page from the homepage
        Then I should see the login page
        When I login with credentials
        Then I should be logged in successfully
        When I search for "<searchTerm>"
        Then I should see search results
        Examples: 
            | searchTerm  |
            | laptop      |