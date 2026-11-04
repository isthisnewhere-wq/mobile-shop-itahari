# Nepal price updates

The catalog currently contains 1463 sourced listings. It is not a complete inventory of all electronics sold in Nepal. Reference prices belong to the named source and exact configuration; availability and local warranty require seller confirmation.

Run node refresh-prices.cjs followed by node build-catalog.cjs. Price history is persistent in price-history.json. Invalid, absent, non-NPR, or unmatched phone-variant quotes retain the previous price and date. The first observation establishes a baseline; no historical movement is fabricated. Proposed laptop calculations remain separate from observed reference changes.

The GitHub workflow runs daily at 00:00 UTC (05:45 Nepal time) and can be run manually. GitHub may delay scheduled runs. It saves verified quotes, rebuilds pages, runs checks, and deploys the result. price-update-status.json records coverage and source errors.

New electronics categories come from the public Gadget House Nepal Store API; phone quotes come from the existing GadgetByte Nepal price-list source. Listing data is dated, not a live retailer inventory guarantee.
