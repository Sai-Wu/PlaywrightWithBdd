Feature: Testing Amazon UI
    
    Scenario Outline: Testing the login functionality
        Given I am on the login page
        When I enter "<username>" and "<password>"
        Then I should see the dashboard
        Examples: 
            | username  | password  |
            | user1     | pass1     |
            | user2     | pass2     |