/*
 * Copyright 2009 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.google.feedserver.tools.commands;

import com.google.feedserver.util.FileUtil;
import com.google.gdata.client.GoogleService;

import java.net.URL;

public abstract class AddFilteredGadget extends GadgetDirFilterCommand {

  public AddFilteredGadget(GoogleService service, FileUtil fileUtil, String gadgetFilterName,
      String gadgetFilterExternalName) {
    super(service, fileUtil, gadgetFilterName, gadgetFilterExternalName);
  }

  @Override
  public void execute(String[] args) throws Exception {
    String gadgetIdOrUrl = checkNotFlag(args[1]);
  
    if (gadgetIdOrUrl == null) {
      throw new IllegalArgumentException("Missing gadget id / gadget spec URL");
    }
  
    URL feedUrl = new URL(getDomainFeedUrl(gadgetFilterName));
    FilteredGadgetEntity entity = new FilteredGadgetEntity(gadgetIdOrUrl);
    entity = filteredGadgetClient.insertEntity(feedUrl, entity);
  }

  @Override
  public void usage(boolean inShell) {
    System.out.println(getFeedClientCommand(inShell) + getCommandName() +
        " <gadgetId|gadgetSpecUrl>");
    System.out.println("    Adds a " + gadgetFilterExternalName +
        " listed gadget for domain's public gadget directory");
  }

}
