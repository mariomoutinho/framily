<?php

it('responds to /api/health with status ok', function () {
    $response = $this->getJson('/api/health');

    $response->assertOk()
        ->assertJsonPath('status', 'ok')
        ->assertJsonPath('app', config('app.name'));
});
